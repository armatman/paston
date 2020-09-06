<template>
  <div id="app">
    <div class="players">
      <div
        v-for="player in players"
        :key="player.name"
        :class="{ 
          player, leader: leadScore === player.score, 
          declared: isDeclar(player.name), 
          folded: player.status === 'fold'
         }"
        :style="{ backgroundColor: player.color }"
        :id="player.name"
      >
        <span
          :id="player.name"
          class="pointer"
          title="Set as Declar"
          v-on:click="setDeclar"
        >{{ player.name }}</span>
        <p class="pointer score" v-on:click="setDealer" :id="player.name">{{ player.score }}</p>
        <p v-show="!player.status">
          <button :id="player.name" v-on:click="fold" class="fold">X</button>
          <button
            :id="player.name"
            v-on:click="check"
            class="check"
          >{{ isDeclar(player.name) ? 'Dec' : 'Set' }}</button>
        </p>
        <p v-show="player.status && player.status !== 'fold'">
          <input
            type="number"
            :ref="player.name"
            placeholder="tricks..."
            class="tricks"
            v-model="player.tricks"
            :id="player.name"
            v-on:keyup="e => debounce(_ => onTrickChange(e))"
          >
          <br>
          <button v-on:click="resetDeclar" :id="player.name" class="cancel">Cancel</button>
        </p>
      </div>
    </div>

    <div class="suits">
      <div
        v-on:click="selectSuit(suit)"
        :class="{ active: activeSuit && activeSuit.id === suit.id }"
        v-for="suit in suits"
        :key="suit.id"
        :style="{ color: suit.color }"
      >{{ suit.symbol }}</div>
    </div>

    <table v-if="rounds.length">
      <thead>
        <th style="color:#888">#</th>
        <th v-for="p in players" :key="p.name">{{ p.name }}</th>
        <th style="color:#888;">Suit</th>
        <th v-tooltip="{ content: totalGameDuration, trigger: 'click' }" hideOnTargetClick="false">⏱</th>
      </thead>
      <tbody>
        <tr v-for="round in rounds" :key="round.num">
          <td style="color:#888">{{ round.num }}</td>
          <td
            v-for="player in round.players"
            :key="player.name"
            :style="{ 
              color: player.score < 0 ? 'red' : 'black', 
              fontWeight: round.currentDeclar.id === player.id ? 'bold' : 'normal' 
            }"
          >{{ player.score }}</td>
          <td :style="{ color: round.activeSuit && round.activeSuit.color }">
            {{ round.activeSuit ? round.activeSuit.symbol : '' }}
            <span
              v-if="!round.activeSuit"
              style="color:green"
            >F</span>
          </td>
          <td style="color:#777">{{ getFormattedRoundDuration(round.roundDuration) }}</td>
        </tr>
      </tbody>
    </table>

    <p>
      <button v-on:click="reset(true)" class="reset">Reset</button>
    </p>
  </div>
</template>

<script>
import moment from "moment";

export default {
  name: "App",
  created() {
    this.currentDeclar = this.currentStarter =
      this.currentDeclar || this.players[0];

    this.roundStartTime = moment();
  },
  data() {
    return {
      roundStartTime: null,
      activeSuit: null,
      suits: [
        {
          id: "spade",
          symbol: "♥",
          color: "black",
          winValue: 0.75,
          looseValue: 0,
          say: "39a5260447ccc538a9f6f40e55734614"
        },
        {
          id: "club",
          symbol: "♣️",
          color: "black",
          winValue: 0.5,
          looseValue: 0.25,
          say: "1b188b96a277f1ca5ef140fb431fe0ff"
        },
        {
          id: "diamond",
          symbol: "♦️",
          color: "red",
          winValue: 0.25,
          looseValue: 0.5,
          say: "52bd371a51e2844adb66a53d7fb1b4ed"
        },
        {
          id: "heart",
          symbol: "♥",
          color: "red",
          winValue: 0,
          looseValue: 0.75,
          say: "3ea35b6bc7ed4356885ded8db7386641"
        }
      ],
      players: this.getItem("players") || [
        {
          id: 0,
          name: "Armen",
          color: "#981a98",
          score: 0,
          status: null /* check, fold */,
          tricks: null,
          say: new Audio(
            `https://ttsmp3.com/created_mp3/ee05b8e61b6c67da9086613946192372.mp3`
          )
        },
        {
          id: 1,
          name: "Karen",
          color: "#276ff1",
          score: 0,
          status: null,
          tricks: null,
          say: new Audio(
            `https://ttsmp3.com/created_mp3/004e30d819dd1fc62a861acf04fb1af6.mp3`
          )
        },
        {
          id: 2,
          name: "Vago",
          color: "#429442",
          score: 0,
          status: null,
          tricks: null,
          say: new Audio(
            `https://ttsmp3.com/created_mp3/41184e15d046300a3898ac4bc9088c43.mp3`
          )
        }
      ],
      currentRound: { num: 0, declar: null, players: [], declarChanged: false },
      currentDeclar: this.getItem("currentDeclar") || null,
      currentStarter: this.getItem("currentStarter") || null,
      leadScore: +localStorage.getItem("leadScore") || null,
      rounds: this.getItem("rounds") || [],
      songs: {
        winner: new Audio(
          "https://dl.mp3fm.me/get/8630/Igor-Rospisnoy_-_Polosa-terpeniya.mp3"
        ),
        declarerStayedAfterFolds: new Audio(
          "https://freesound.org/data/previews/249/249524_3906011-lq.mp3"
        ),
        declarerFolded: new Audio(
          "https://freesound.org/data/previews/253/253886_3169537-lq.mp3"
        ),
        fold: new Audio(
          "https://www.zapsplat.com/wp-content/uploads/2015/sound-effects-35448/zapsplat_cartoon_bubble_pop_007_40279.mp3?_=7"
        ),
        bazhne: new Audio(
          "https://ttsmp3.com/created_mp3/06acbe717252aad5dd7e045d2ef64c3d.mp3"
        )
      }
    };
  },
  computed: {
    hasWinner() {
      return this.players.find(e => e.score >= 121);
    },

    totalGameDuration() {
      const totalMlscnds = this.rounds.reduce((a, b) => {
        return a + b.roundDuration;
      }, 0);

      const totalDur = moment.duration(totalMlscnds);

      return `${totalDur.hours()}:${totalDur.minutes()}:${totalDur.seconds()}`;
    },

    playersLeft() {
      return this.players.filter(e => e.status !== "fold");
    },

    uncheckedPlayersLeft() {
      return this.players.filter(e => e.status !== "check");
    },

    playersWithTricksLeft() {
      return this.players.filter(e => e.tricks !== null);
    }
  },
  methods: {
    debounce(fn) {
      if (this.timeout) clearTimeout(this.timeout);
      this.timeout = setTimeout(fn, 750);
    },

    onTrickChange(e) {
      let { value, id } = e.target;
      value = +value;

      if (value > 10) {
        e.target.value = 10;
        return;
      } else if (value < 0) {
        e.target.value = 0;
        return;
      }

      const leftPlCount = this.playersLeft.length;
      if (leftPlCount === 2) {
        const leftPl = this.playersLeft.find(e => e.name !== id);
        this.players.forEach(e => {
          if (e.id === leftPl.id) {
            e.tricks = 10 - value;
            e.status = "check";
          }
          return e;
        });
        this.nextRound();
      } else if (leftPlCount === 3) {
        const leftUnchPl = this.uncheckedPlayersLeft;
        const plWithTricksCount = this.playersWithTricksLeft.length;
        if (leftUnchPl.length === 1 && plWithTricksCount === 2) {
          const scoreSum = this.players.reduce((a, b) => +a + +b.tricks, 0);
          this.players.forEach(e => {
            if (e.id === leftUnchPl[0].id) {
              e.tricks = 10 - scoreSum;
              e.status = "check";
            }
            return e;
          });
          this.nextRound();
        }
      }
    },

    selectSuit(suit) {
      this.activeSuit =
        this.activeSuit && suit.id === this.activeSuit.id ? null : suit;
      this.activeSuit &&
        this.playSong(
          `https://ttsmp3.com/created_mp3/${this.activeSuit.say}.mp3`
        );
    },

    sayCardStarterName() {
      let sayName = this.rounds[0].currentStarter.say;

      sayName.play();

      this.afterAllSongsEnded(_ => this.songs.bazhne.play());
    },

    getFormattedRoundDuration(d) {
      return moment(d).format("m:ss");
    },

    playSong(path, timeout = 0) {
      const audio = new Audio(path);
      timeout ? setTimeout(_ => audio.play(), timeout) : audio.play();
      return audio;
    },

    isDeclar(name) {
      return this.currentDeclar && this.currentDeclar.name === name;
    },

    setDealer(e) {
      this.currentStarter = this.currentDeclar = this.players.find(
        p => p.name === e.target.id
      );
    },

    setDeclar(e) {
      this.currentDeclar = this.players.find(p => p.name === e.target.id);
    },

    resetDeclar(e) {
      const name = e.target.id;
      this.players.find(p => p.name === name).status = null;
    },

    check(e) {
      if (!this.activeSuit) return alert("Select the Suit first");

      const { id } = e.target;

      this.players.forEach(p => {
        if (p.name === id) p.status = "check";
        return p;
      });

      setTimeout(_ => this.$refs[id][0].focus(), 0);
    },

    fold(e) {
      const selectedPlayerIndex = this.players.findIndex(
        p => p.name === e.target.id
      );
      this.players[selectedPlayerIndex].status = "fold";

      if (
        this.currentDeclar.name === e.target.id ||
        this.declarLeftAfterFolds()
      )
        this.nextRound();

      this.songs.fold.play();
    },

    reset(clearStorage = false) {
      this.players.forEach(e => (e.status = e.tricks = null));

      this.activeSuit = null;

      if (clearStorage) {
        this.rounds = [];
        this.players.forEach(e => {
          e.score = 0;
        });
        this.currentRound = {
          num: 0,
          declar: null,
          players: [],
          declarChanged: false
        };

        this.rmItem("rounds");
        this.rmItem("players");
        this.rmItem("leadScore");
        this.rmItem("currentDeclar");
        this.rmItem("currentStarter");

        this.roundStartTime = moment();
      }

      if (clearStorage) {
        this.songs.winner.pause();
        this.songs.winner.currentTime = 0;
      }
    },

    declarLeftAfterFolds() {
      return (
        this.players.filter(
          e => e.status === "fold" && this.currentDeclar.name !== e.name
        ).length === 2
      );
    },

    setScores() {
      this.players.forEach(e => {
        e.tricks = +e.tricks;

        const prevScore = e.score;

        const noFolds = !this.players.filter(e => e.status === "fold").length;
        const isDeclarer = this.currentDeclar.name === e.name;
        const declarerFolded = this.players.find(
          e => e.status === "fold" && e.name === this.currentDeclar.name
        );

        if (this.declarLeftAfterFolds()) {
          if (e.name === this.currentDeclar.name) e.score += 10;
          else e.score -= 2;
          this.songs.declarerStayedAfterFolds.play();
        } else if (declarerFolded) {
          if (e.name === this.currentDeclar.name) e.score -= 10;
          else e.score += 2;
          this.songs.declarerFolded.play();
        } else if (noFolds) {
          if (isDeclarer && e.tricks < 6) e.score -= 20;
          else if (!e.tricks) e.score -= 10;
          else if (e.tricks === 1) e.score -= 9;
          else if (e.tricks === 3) e.score += 10;
          else if (e.tricks === 4) e.score += 20;
          else if (e.tricks >= 6) {
            e.score += 20;
            for (let i = 4; i < e.tricks; i++) e.score += 10;
          }
        } else {
          if (e.status === "fold") e.score -= 5;
          else if (isDeclarer && e.tricks < 6) e.score -= 15;
          else if (!e.tricks) e.score -= 10;
          else if (e.tricks === 1) e.score -= 9;
          else if (e.tricks === 2) e.score -= 8;
          else if (e.tricks === 3) e.score -= 7;
          else if (e.tricks === 5) e.score += 10;
          else if (e.tricks >= 6) {
            e.score += 20;
            for (let i = 6; i < e.tricks; i++) e.score += 10;
          }
        }

        // multiply scores by current suit
        if (
          isDeclarer &&
          e.status !== "fold" &&
          !this.declarLeftAfterFolds() &&
          !declarerFolded
        ) {
          let newScore = e.score - prevScore;

          newScore *=
            e.tricks > 5
              ? this.activeSuit.winValue
              : this.activeSuit.looseValue;

          e.score = Math.round(e.score + newScore);
        }

        const hasScoreBelow121 = e.score <= -121;
        if (hasScoreBelow121) e.score = 0;
      });

      !this.hasWinner && this.afterAllSongsEnded(this.sayCardStarterName);
    },

    afterAllSongsEnded(fn) {
      const interval = setInterval(() => {
        if (this.allSongsEnded()) {
          clearInterval(interval);
          fn();
        }
      }, 100);
    },

    allSongsEnded() {
      let songsEnded = [];
      for (let prop in this.songs) {
        const song = this.songs[prop];
        songsEnded.push(!(song.duration > 0 && !song.paused));
      }
      this.players.forEach(p => {
        songsEnded.push(!(p.say.duration > 0 && !p.say.paused));
      });

      return songsEnded.every(e => e);
    },

    nextRound() {
      this.setScores();

      const num =
        this.rounds && this.rounds[0]
          ? this.rounds[0].num + 1
          : this.currentRound.num + 1;

      this.currentRound = {
        num,
        players: JSON.parse(JSON.stringify(this.players)),
        currentDeclar: this.currentDeclar,
        currentStarter: this.currentStarter,
        declarChanged: this.currentDeclar.name !== this.currentStarter.name,
        activeSuit: this.activeSuit,
        roundDuration: moment
          .duration(moment().diff(this.roundStartTime))
          .asMilliseconds()
      };

      this.leadScore = Math.max(...this.players.map(e => e.score));

      this.rounds.unshift(this.currentRound);

      // reset for new round
      const curStarterIndex = this.players.findIndex(
        e => e.name === this.currentStarter.name
      );

      if (curStarterIndex === 2)
        this.currentStarter = this.currentDeclar = this.players[0];
      else
        this.currentStarter = this.currentDeclar = this.players[
          curStarterIndex + 1
        ];

      this.players.forEach(e => (e.status = e.tricks = null));

      this.setItem("rounds", this.rounds);
      this.setItem("players", this.players);
      this.setItem("leadScore", this.leadScore);
      this.setItem("currentDeclar", this.currentDeclar);
      this.setItem("currentStarter", this.currentStarter);

      this.reset();

      if (this.hasWinner) this.songs.winner.play();
      else this.roundStartTime = moment();
    },

    getItem(key) {
      return JSON.parse(localStorage.getItem(key));
    },

    setItem(key, item) {
      localStorage.setItem(key, JSON.stringify(item));
    },

    rmItem(key) {
      localStorage.removeItem(key);
    }
  }
};
</script>

<style lang="stylus">
#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  text-align: center;
  color: #2c3e50;
  margin-top: 15px;
}

.suits {
  margin: 20px 0 10px;
  font-size: 30px;
  display: flex;
  justify-content: center;

  div {
    border-radius: 30px;
    padding: 3px 12px;
    cursor: pointer;
    transition: opacity 0.3s;
    opacity: 0.5;

    &.active {
      box-sizing: border-box;
      opacity: 1;
    }
  }
}

table {
  margin: 0 auto;
  font-size: 16px;

  td {
    padding: 3px 0;
  }

  th {
    padding: 5px 5px;
  }
}

.players {
  display: flex;
  justify-content: space-evenly;
  align-items: center;

  .player {
    position: relative;
    font-size: 16px;
    transition: 0.2s;
    padding: 13px 2% 0;
    border-radius: 15px;
    color: #fff;
    font-weight: bold;
    box-sizing: border-box;
    box-shadow: 0px 2px 4px 0px gray;
    opacity: 0.85;

    &.declared {
      border: 4px solid #f55385;
      opacity: 1;
    }

    &.folded {
      opacity: 0.5;
    }

    &.leader {
      border-bottom: 5px solid yellow;
      border-top: 5px solid yellow;
    }

    .tricks {
      width: 50px;
      padding: 10px;
      outline: none;
      border: none;
      border-radius: 10px;
      text-align: center;
      font-size: 16px;
    }

    .score {
      font-size: 25px;
      margin: 14px 0;
    }
  }
}

button {
  cursor: pointer;
  border: none;
  font-weight: bold;
  outline: none;
  padding: 3px 6px;

  &.fold, &.check {
    font-size: 15px;
    padding: 4px 8px;
    box-shadow: border-box;
    text-transform: uppercase;
  }

  &.fold {
    padding: 4px 16px;
    margin-right: 3px;
    background: lightcoral;
  }

  &.check {
    background: lightgreen;
  }

  &.nextRound {
    background: #44b5fb;
    text-transform: uppercase;
    padding: 15px;
    font-size: 16px;
    color: #fff;
  }

  &.reset, &.cancel {
    transition: 0.3s;
    opacity: 0.5;
    text-transform: uppercase;
  }

  &.cancel {
    margin-top: 10px;
    opacity: 0.8;
  }

  &.reset:hover {
    opacity: 1;
  }
}

.pointer {
  cursor: pointer;
}
</style>
