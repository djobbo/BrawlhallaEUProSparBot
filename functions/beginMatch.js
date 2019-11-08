const shuffle = require('shuffle-array');
const Match = require('../models/Match');

const getPlayerEmbed = require('./util/getPlayerEmbed');

module.exports = (gamemode, players, channel) => {
    console.log('Begin Match');

    shuffle(players);

    let teamSize = players.length / 2;

    let playersTeam1 = players.filter((_, i) => i < teamSize);
    let team1 = {
        players: playersTeam1,
        teamRating: playersTeam1.reduce((a, b) => a + b.rating, 0) / teamSize
    };

    let playersTeam2 = players.filter((_, i) => i >= teamSize);
    let team2 = {
        players: playersTeam2,
        teamRating: playersTeam2.reduce((a, b) => a + b.rating, 0) / teamSize

    };

    // Higher Team Rating is considered higher seed (Team A)
    let is1A = team1.teamRating > team2.teamRating;

    new Match({
        teamA: is1A ? team1 : team2,
        teamB: is1A ? team2 : team1,
        gamemode,
        scoreTeamA: 0,
        scoreTeamA: 0,
    })
        .save()
        .then(match => {
            let playerPromises = [];
            for (let i = 0; i < players.length; i++) {
                playerPromises.push(new Promise((resolve, reject) => {
                    players[i].match = match._id;
                    players[i].state = `In${gamemode}Match`;
                    players[i]
                        .save()
                        .then(resolve())
                        .catch(console.error);
                }))
            }
            Promise.all(playerPromises)
                .then(_ => {
                    channel.send({ embed: getPlayerEmbed(match) });
                })
                .catch(console.error);
        })
        .catch(console.error);
}