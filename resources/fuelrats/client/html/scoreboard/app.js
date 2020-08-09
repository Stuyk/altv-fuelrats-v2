Vue.config.devtools = true;
Vue.prototype.window = window;

const app = new Vue({
    el: '#app',
    data() {
        return {
            players: []
        };
    },
    computed: {
        orderPlayers() {
            return this.players
                .sort((a, b) => {
                    if (a.score === b.score) {
                        return a.name - b.name;
                    }

                    return a.score - b.score;
                })
                .reverse();
        }
    },
    methods: {
        setScore(name, score, ping) {
            const players = [...this.players];
            const index = players.findIndex(p => p.name === name);
            if (index <= -1) {
                players.push({ name, score, ping });
                this.players = players;
                return;
            }

            players[index].name = name;
            players[index].score = score;
            players[index].ping = ping;
            this.players = players;
        },
        resetScore() {
            this.players = [];
        }
    },
    mounted() {
        if ('alt' in window) {
            alt.on('scoreboard:Set', this.setScore);
            alt.on('scoreboard:Reset', this.resetScore);
            alt.emit('selection:Ready');
        } else {
            this.setScore('Johnny#4219840211', 1, 25);
            this.setScore('Bobby', 2, 25);
        }
    }
});
