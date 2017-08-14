const config = require('config');

module.exports = function(bot){
	return {
		name: "Language Module",
		enabled: true,
		init: async function init(cb){
			bot.lang = {};

			bot.log("Loading language packs...");
			const languages = config.get("Languages");
			bot.lang.strings = {};
			for(var i in languages){
				if(languages.hasOwnProperty(i)){
					try{
						bot.lang.strings[i] =  require("../lang/"+languages[i]);
						bot.log(`Loaded language ${bot.lang.strings[i].LANGUAGE_NAME} as ${i}`);
					}catch(e){
						bot.error("Failed to load language: "+e.message);
					}
				}
			}

			bot.log("Populating Language Cache...");
			bot.lang.languageCache = {};
			try{
				const serverLanguages = await bot.database.getLanguages();
				for(var j = 0; j < serverLanguages.length; j++){
					bot.lang.languageCache[serverLanguages[j].server] = serverLanguages[j].language;
				}
			}catch(e){
				bot.error("Error populating language cache:");
				bot.error(""+e.stack);
			}

			bot.lang.getTranslation = function getTranslation(server, key, format){
				return new Promise(async function(fulfill){
					var output = bot.lang.getTranslationFor(await bot.lang.getLocale(server), key);
					fulfill(format ? output.formatUnicorn(format) : output)
				});
			};

			bot.lang.getLocalNumber = function getLocalNumber(server, number){
				return new Promise(async function(fulfill){
					fulfill(number.toLocaleString(await bot.lang.getLocale(server)))
				});
			};

			bot.lang.getLocalDate = function getLocalDate(server, date){
				return new Promise(async function(fulfill){
					fulfill(date.toLocaleString(await bot.lang.getLocale(server)))
				});
			};

			bot.lang.getLocale = function getLocale(server){
				return new Promise(async function(fulfill){
					if(!bot.lang.languageCache[server]){
						bot.warn("Had to populate languageCache for "+server);
						const thisServer = await bot.database.getServerLanguage(server)[0];
						bot.lang.languageCache[server] = thisServer && thisServer.language ? thisServer.language : "default";
					}
					fulfill(bot.lang.languageCache[server]);
				});
			};

			bot.lang.getTranslationFor = function getTranslationFor(lang, key){

				if(bot.lang.strings[lang] && bot.lang.strings[lang][key]){
					return bot.lang.strings[lang][key];
				}else if(bot.lang.strings.default[key]){
					return bot.lang.strings.default[key];
				}else{
					bot.warn("Tried to translate unknown key: "+key);
					return key;
				}
			};

			cb();
		}
	}
};