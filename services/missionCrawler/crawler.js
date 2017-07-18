var https = require('https');
var cheerio = require('cheerio');
var path = require('path');
var vehiclesById = require('./carsById.json');
var fs = require('fs');
var MAX_MISSIONS = 200;

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

for (var i = 0; i < MAX_MISSIONS; i++) {
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
			mission.id = missionId;
			mission.title = $('h1').text().trim();
			var vehicles = {};

			$('tr').each(function() {
				var key = $(this).find('td:first-child').text().trim();
				var value = $(this).find('td:nth-child(2)').text().trim();

				if (!key.length > 0) {
					return;
				} else if (key.indexOf('Credits') >= 0) {
					mission.avg_creds = value;
				} else if (key.indexOf('Benötigte') >= 0) {
					var found = false;
					for (vehicleId in vehiclesById) {
						if (containsAny(key, vehiclesById[vehicleId])) {
							vehicles[vehicleId] = (vehicles[vehicleId]) ? vehicles[vehicleId] : {};
							vehicles[vehicleId].required = value;
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
							vehicles[vehicleId].probability = value;
							found = true;
							break;
						}
					}
					if (!found) {
						console.log("Unknown2: " + key);
					}
				}
			});
			mission.vehicles = vehicles;
			missions.push(mission);
			if (missions.length >= MAX_MISSIONS) {
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
