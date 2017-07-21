var https = require('https');
var cheerio = require('cheerio');
var path = require('path');
var fs = require('fs');
var START_MISSION = 1;

var locale = "de";
var localizationDefinitions = {
    'de': {},
    'en': {},
    'nl': {}
};

// DE
localizationDefinitions.de.numberOfMissions = 301;
localizationDefinitions.de.options = {
    host: 'www.leitstellenspiel.de',
    path: '/einsaetze/'
};
localizationDefinitions.de.strings = {
    'required': 'Benötigte',
    'credits': 'Credits',
    'probability': 'Anforderungswahrscheinlichkeit',
    'prisoners': 'Maximale Anzahl an Gefangene',
    'maxPatients': 'Maximale Patientenanzahl',
    'minPatients': 'Mindest Patientenanzahl',
    'department': 'Fachrichtung für Patienten',
    'transportProbability': 'Wahrscheinlichkeit, dass ein Patient transportiert'

}

// EN
localizationDefinitions.en.numberOfMissions = 131;
localizationDefinitions.en.options = {
    host: 'www.missionchief.com',
    path: '/einsaetze/'
};
localizationDefinitions.en.strings = {
    'required': 'Required',
    'credits': 'credits',
    'probability': 'Probability of ',
    'prisoners': 'Maximum Number of Prisoners',
    'maxPatients': 'Max. Patients',
    'minPatients': 'Minimum patient number',
    'department': 'Patient Specializations',
    'transportProbability': 'Probability that a patient has to be transported'

}

// NL
localizationDefinitions.nl.numberOfMissions = 231;
localizationDefinitions.nl.options = {
    host: 'www.meldkamerspel.com',
    path: '/einsaetze/'
};
localizationDefinitions.nl.strings = {
    'required': 'Benodigde',
    'credits': 'Credits',
    'probability': 'benodigd waarschijnlijkheid',
    'prisoners': 'Maximaal aantal gevangenen',
    'maxPatients': 'Maximale patiënten aantal',
    'minPatients': 'Minimale aantal slachtoffers',
    'department': 'Gespecialiseerde afdeling voor patiënten',
    'transportProbability': 'Waarschijnlijkheid dat een patiënt getransporteerd moet worden'

}

// Was the script called with a locale?
process.argv.forEach((val, index) => {
    if (val.indexOf('locale') >= 0) {
        var tempLocale = val.split('=').pop();
        if (['de', 'en', 'nl'].indexOf(tempLocale) >= 0) {
            locale = tempLocale;
        } else {
            console.log('Found unsupported locale: ' + tempLocale);
        }
    }

});
var localization = localizationDefinitions[locale];
var vehiclesById = require('./carsById_' + locale + '.json');

var missions = [];

function containsAny(str, substrings) {
    for (var i = 0; i != substrings.length; i++) {
        var substring = substrings[i];
        if (str.indexOf(substring) != -1) {
            return true;
        }
    }
    return false;
}
var exceptions = ['Fire Stations'];

for (var i = START_MISSION; i < localization.numberOfMissions; i++) {
    var options = {
        host: localization.options.host,
        path: localization.options.path + i
    };
    https.get(options, function (res) {
        var body = '';
        res.on("data", function (chunk) {
            body += chunk;
        });

        res.on('end', function (i) {
            var missionId = res.req.path.split('/').pop();
            $ = cheerio.load(body);
            var mission = {};
            mission.id = parseInt(missionId);
            mission.title = $('h1').text().trim();
            var vehicles = {};

            $('tr').each(function () {
                var key = $(this).find('td:first-child').text().trim();
                var value = $(this).find('td:nth-child(2)').text().trim();

                if (!key.length > 0) {
                    return;
                } else if (key.indexOf(localization.strings.credits) >= 0) {
                    mission.avg_creds = parseInt(value);
                } else if (key.indexOf(localization.strings.required) >= 0) {
                    var found = false;
                    for (vehicleId in vehiclesById) {
                        if (containsAny(key, vehiclesById[vehicleId])) {
                            vehicles[vehicleId] = (vehicles[vehicleId]) ? vehicles[vehicleId] : {};
                            vehicles[vehicleId].required = parseInt(value);
                            found = true;
                            break;
                        }
                    }
                    if (!found && exceptions.indexOf(key) >= 0) {
                        console.log("Unknown: " + key);
                    }
                } else if (key.indexOf(localization.strings.probability) >= 0) {
                    var found = false;
                    for (vehicleId in vehiclesById) {
                        if (containsAny(key, vehiclesById[vehicleId])) {
                            vehicles[vehicleId] = (vehicles[vehicleId]) ? vehicles[vehicleId] : {};
                            vehicles[vehicleId].probability = parseInt(value);
                            found = true;
                            break;
                        }
                    }
                    if (!found) {
                        console.log("Unknown2: " + key);
                    }
                } else if (key.indexOf(localization.strings.prisoners) >= 0) {
                    mission.maxPrisoners = parseInt(value);
                } else if (key.indexOf(localization.strings.maxPatients) >= 0) {
                    mission.patients = (mission.patients) ? mission.patients : {};
                    mission.patients.max = parseInt(value);
                } else if (key.indexOf(localization.strings.minPatients) >= 0) {
                    mission.patients = (mission.patients) ? mission.patients : {};
                    mission.patients.min = parseInt(value);
                } else if (key.indexOf(localization.strings.department) >= 0) {
                    mission.patients = (mission.patients) ? mission.patients : {};
                    mission.patients.department = value;
                } else if (key.indexOf(localization.strings.transportProbability) >= 0) {
                    mission.patients = (mission.patients) ? mission.patients : {};
                    mission.patients.probability = parseInt(value);
                }


            });
            mission.vehicles = vehicles;
            missions.push(mission);
            if (missions.length >= localization.numberOfMissions - START_MISSION) {
                function compare(a, b) {
                    if (a.id < b.id)
                        return -1;
                    if (a.id > b.id)
                        return 1;
                    return 0;
                }

                missions.sort(compare);
                fs.writeFile(path.join(__dirname, '/') + 'missionDefinitions_' + locale + '.json', JSON.stringify(missions), {
                    flag: 'w'
                });
                //console.log(missions);
            }

        });
    }).on('error', function (e) {
        console.log("Got error: " + e.message);
    });

}
