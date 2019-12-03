//App
let app = new Vue({
    el: "#container",

    data: {
        //Current theme
        theme: "dark",

        //Current state
        state: "main",

        //Current open selector
        selector: "none",

        //Current score
        score: 0,

        //Current prestige goal
        goal: 10,

        //Current amount gained on click
        gain: 1,

        //Number of prestiges
        prestiges: 0,

        //Number of prestige points
        prestigePoints: 0,

        //Prestige upgrades
        upgrades: [
            //Prestige point multiplier upgrade
            {
                cost: 2,
                costScaling: 5,

                amount: 0,

                boost() {
                    return 2 ** this.amount;
                }
            },

            //Number gain upgrade
            {
                cost: 4,
                costScaling: 5,

                amount: 0,

                boost() {
                    return this.amount;
                }
            },

            //Reduce requirement upgrade
            {
                cost: 5,
                costScaling: 5,

                amount: 0,

                boost() {
                    return 0.9 ** this.amount;
                }
            }
        ],

        //Current save file
        currentSaveFile: 0,

        //All saves
        saveFiles: ["", "", ""],
    },

    methods: {
        //UTILITY FUNCTIONS
        //Capitalizes a word
        capitalize(word) {
            return word[0].toUpperCase() + word.slice(1, word.length).toLowerCase();
        },

        //Generates the theme class used for a given element
        themeClass(elem) {
            return `${elem}-${this.theme}`;
        },

        //Rounds a number to a given number of decimal places
        roundTo(num, places = 0) {
        	return Math.round(num * 10 ** places) / (10 ** places);
        },

        //Formats a number in exponential format (if over the requirement)
        formatSci(num, limit = 1e6, places = 2) {
        	if (num >= limit) {
                //Splits the orders of magnitude and the amount before it to format it
        		let oom = Math.floor(Math.log10(num));
        		let div = this.roundTo(num / (10 ** oom), places);

        		return `${div}e${oom}`;
        	} else
        		return this.roundTo(num, places).toString();
        },

        //Returns the correct plural ending (s ending)
        pluralize(num) {
            return Math.abs(num) === 1 ? "" : "s"
        },

        //SETTERS
        //Sets the current theme
        setTheme(theme) {
            this.theme = theme;
        },

        //Sets the state of the game
        setState(state) {
            this.state = state;

            //Disables open selectors
            this.setSelector("none");
        },

        //Sets the current open selector
        setSelector(selector) {
            this.selector = selector;
        },

        //Updates the score
        setScore(score) {
            this.score = score;
        },

        addScore(score) {
            this.setScore(this.score + score);
        },

        //Gets the current prestige point gain
        prestigePointGain() {
            return this.upgrades[0].boost();
        },

        //Actual number gain
        actualGain() {
            return this.gain + this.upgrades[1].boost();
        },

        //Actual prestige goal
        actualGoal() {
            return this.goal * this.upgrades[2].boost();
        },

        //GAME STUFF
        //Prestige resets score but doubles the goal and increases the gain by 1
        prestige() {
            //Checks if the player really wants to prestige (only on first prestige)
            if (
                this.prestiges === 0 &&
                !confirm("Are you sure you want to prestige? This will reset your score, while adding 1 to your number gain and doubling the goal. You will also receive a Prestige point.")
            ) return;

            this.setScore(0);
            this.gain++;
            this.goal *= 2;

            this.prestiges++;

            this.prestigePoints += this.prestigePointGain();
        },

        //Attempts to buy an upgrade
        buyUpgrade(id) {
            let upgrade = this.upgrades[id];

            if (this.prestigePoints >= upgrade.cost) {
                this.prestigePoints -= upgrade.cost;

                upgrade.amount++;

                upgrade.cost *= upgrade.costScaling;

                //Mini-prestige element
                this.setScore(0);
                this.gain = 1;
                this.goal = 10;
            }
        },

        //SAVE FILE FUNCTIONS
        //Attempts to load a value from localStorage, replacing it with a default value if it does not exist
        lsGetOrSetDefault(item, def) {
            if (localStorage.getItem(item) === null)
                localStorage.setItem(item, def);

            return localStorage.getItem(item);
        },

        //Encodes the current save data
        encodeSaveData() {
            return `${this.theme}|${this.state}|${this.score}|${this.goal}|${this.gain}|${this.prestiges}|${this.prestigePoints}|${this.upgrades[0].cost}|${this.upgrades[0].amount}|${this.upgrades[1].cost}|${this.upgrades[1].amount}|${this.upgrades[2].cost}|${this.upgrades[2].amount}`;
        },

        //Sets a save file
        setSaveFile(file) {
            this.saveFiles[file] = this.encodeSaveData();

            //Saves to local storage
            localStorage.setItem(`save${file}`, this.saveFiles[file]);
        },

        //Loads a save file
        loadSaveFile(file) {
            let save = this.saveFiles[file];
            let data = save.split("|");

            this.setTheme(data[0]);
            this.setState(data[1]);
            this.setScore(data.length >= 3 ? parseInt(data[2]) : 0);
            this.goal = data.length >= 4 ? parseInt(data[3]) : 10;
            this.gain = data.length >= 5 ? parseInt(data[4]) : 1;
            this.prestiges = data.length >= 6 ? parseInt(data[5]) : 0;
            this.prestigePoints = data.length >= 7 ? parseInt(data[6]) : 0;
            this.upgrades[0].cost = data.length >= 8 ? parseInt(data[7]) : 2;
            this.upgrades[0].amount = data.length >= 9 ? parseInt(data[8]) : 0;
            this.upgrades[1].cost = data.length >= 10 ? parseInt(data[9]) : 4;
            this.upgrades[1].amount = data.length >= 11 ? parseInt(data[10]) : 0;
            this.upgrades[2].cost = data.length >= 12 ? parseInt(data[11]) : 5;
            this.upgrades[2].amount = data.length >= 13 ? parseInt(data[12]) : 0;
        },

        //Saves the game in the current save slot
        save() {
            this.setSaveFile(this.currentSaveFile);
        },

        //Resets the current save file
        resetSave() {
            //Prompt to make sure user wants to reset
            if (
                confirm("Do you want to reset your save? You will lose everything!") &&
                confirm("Are you sure about this? There is no way to get your save back!") &&
                confirm("This is your last warning!")
            ) {
                //Resets all values
                this.setTheme("dark");
                this.setState("main");
                this.setScore(0);
                this.goal = 10;
                this.gain = 1;
                this.prestiges = 0;
                this.prestigePoints = 0;
                this.upgrades[0].cost = 2;
                this.upgrades[0].amount = 0;
                this.upgrades[1].cost = 4;
                this.upgrades[1].amount = 0;
                this.upgrades[2].cost = 5;
                this.upgrades[2].amount = 0;

                //Saves over save file
                this.save();
            }
        },
    }
});

//Attempts to load save files
app.saveFiles = app.saveFiles.map((e, i) => app.lsGetOrSetDefault(`save${i}`, app.encodeSaveData()));

//Gets the current save file
app.currentSaveFile = parseInt(app.lsGetOrSetDefault("saveFile", 0));

//Loads the current save file
app.loadSaveFile(app.currentSaveFile);

//Auto-save interval
setInterval(() => {
    app.save();
}, 5 * 1000);
