var https = require('https');
var cheerio = require('cheerio');
var path = require('path');
var vehiclesById = require('./carsById.json');
var fs = require('fs');
var START_MISSION = 1;
var END_MISSION = 300;

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

for (var i = START_MISSION; i < END_MISSION; i++) {
	var options = {
		host: 'www.leitstellenspiel.de',
		path: '/einsaetze/' + i
	};

	https.get(options, function(res) {
		var body = '';
		res.on("data", function(chunk) {
			body += chunk;
		});

		res.on('end', function(i) {
			var missionId = res.req.path.split('/').pop();
			$ = cheerio.load(body);
			var mission = {};
			mission.id = parseInt(missionId);
			mission.title = $('h1').text().trim();
			var vehicles = {};

			$('tr').each(function() {
				var key = $(this).find('td:first-child').text().trim();
				var value = $(this).find('td:nth-child(2)').text().trim();

				if (!key.length > 0) {
					return;
				} else if (key.indexOf('Credits') >= 0) {
					mission.avg_creds = parseInt(value);
				} else if (key.indexOf('Benötigte') >= 0) {
					var found = false;
					for (vehicleId in vehiclesById) {
						if (containsAny(key, vehiclesById[vehicleId])) {
							vehicles[vehicleId] = (vehicles[vehicleId]) ? vehicles[vehicleId] : {};
							vehicles[vehicleId].required = parseInt(value);
							found = true;
							break;
						}
					}
					if (!found) {
						console.log("Unknown: " + key);
					}
				} else if (key.indexOf('Anforderungswahrscheinlichkeit') >= 0) {
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
				} else if (key.indexOf('Maximale Anzahl an Gefangene') >= 0) {
					mission.maxPrisoners = parseInt(value);
				} else if (key.indexOf('Maximale Patientenanzahl') >= 0) {
					mission.patients = (mission.patients) ? mission.patients : {};
					mission.patients.max = parseInt(value);
				} else if (key.indexOf('Mindest Patientenanzahl') >= 0) {
					mission.patients = (mission.patients) ? mission.patients : {};
					mission.patients.min = parseInt(value);
				} else if (key.indexOf('Fachrichtung für Patienten') >= 0) {
					mission.patients = (mission.patients) ? mission.patients : {};
					mission.patients.department = value;
				} else if (key.indexOf('Wahrscheinlichkeit, dass ein Patient transportiert') >= 0) {
					mission.patients = (mission.patients) ? mission.patients : {};
					mission.patients.probability = parseInt(value);
				}


			});
			mission.vehicles = vehicles;
			missions.push(mission);
			if (missions.length >= END_MISSION - START_MISSION) {
				function compare(a, b) {
					if (a.id < b.id)
						return -1;
					if (a.id > b.id)
						return 1;
					return 0;
				}

				missions.sort(compare);
				fs.writeFile(path.join(__dirname, '/') + 'crawlResults.json', JSON.stringify(missions), {
					flag: 'w'
				});
				//console.log(missions);
			}

		});
	}).on('error', function(e) {
		console.log("Got error: " + e.message);
	});

}
