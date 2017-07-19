(function() {
	function setValues() {
		I18n.translations.de['lssm']['missionHelper'] = {
			carmh: 'Benötigte Fahrzeuge'
		}

		I18n.translations.en['lssm']['missionHelper'] = {
			carmh: 'Required vehicles:'
		}

		I18n.translations.nl['lssm']['missionHelper'] = {
			carmh: 'Benodigde Voertuigen:'
		}
	}

	var missionHelp = $('#mission_help');

	if (missionHelp.length > 0) {
		setValues();
		var missionData;
		var vehicleData;
		var missionId = missionHelp.attr('href').split("/").pop();
		$.when(
			$.getJSON(lssm.getlink("/services/missionCrawler/crawlResults.json"), function(data) {
				missionData = data;
			}), $.getJSON(lssm.getlink("/services/missionCrawler/carsById.json"), function(data) {
				vehicleData = data;
			})).then(function() {
			var mission = missionData[missionId];
			if (mission) {
				var aaoText = I18n.t('lssm.missionHelper.missions.' + missionId);
				var markup = '<div class="alert alert-warning">';
				markup += '<h3>' + I18n.t('lssm.missionHelper.carmh') + '</h3>';
				markup += '<div>';
				for (var vehicleId in mission.vehicles) {
					var vehicle = mission.vehicles[vehicleId];
					vehicle.probability = (vehicle.probability) ? vehicle.probability : 100;
					vehicle.required = (vehicle.required) ? vehicle.required : 'mind. 1';
					markup += vehicle.required + "x " + vehicleData[vehicleId][0] + ' (' + vehicle.probability + '%)<br>';
				};
				markup += '</div>';
				if (mission.avg_creds) {
					markup += '<span class="badge">Credits: ~ ' + mission.avg_creds + '</span>';
				}
				if (mission.patients && mission.patients.probability) {
					markup += '<span class="badge">Transportwahrscheinlichkeit: ' + mission.patients.probability + ' %</span>';
				}
				markup += '</div>';
				$('#mission-form').prepend(markup);
			}
		});
	}

	function request1() {
		return $.getJSON(lssm.getlink("/services/missionCrawler/crawlResults.json"));
	}

	function request2() {
		return $.getJSON(lssm.getlink("/services/missionCrawler/carsById.json"));
	}

})();
