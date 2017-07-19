(function () {
    function setValues() {
        I18n.translations.de['lssm']['missionHelper'] = {
            carmh: 'Benötigte Fahrzeuge',
            transport_probability: 'Transportwahrscheinlichkeit',
            credits: 'Credits'
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
        var markup = '<div class="alert alert-warning">';
        markup += '<h3>' + I18n.t('lssm.missionHelper.carmh') + '</h3>';
        markup += '<span id="lssm-missionhelper-spinner"><span class="glyphicon glyphicon-refresh spinning"></span> Loading...</span>';
        markup += '<div id="lssm-missionhelper-content">';
        markup += '</div>';
        markup += '</div>';
        $('#mission-form').prepend(markup);

        var missionData;
        var vehicleData;

        $.when(
            $.getJSON(lssm.getlink("/services/missionCrawler/crawlResults.json"), function (data) {
                missionData = data;
            }), $.getJSON(lssm.getlink("/services/missionCrawler/carsById.json"), function (data) {
                vehicleData = data;
            })).then(function () {
            var missionId = missionHelp.attr('href').split("/").pop();

            var mission = missionData[missionId - 1]; // Reduce by 1 due array is zero based

            if (mission) {
                var markup = '<div>';
                for (var vehicleId in mission.vehicles) {
                    var vehicle = mission.vehicles[vehicleId];
                    vehicle.probability = (vehicle.probability) ? vehicle.probability : 100;
                    vehicle.required = (vehicle.required) ? vehicle.required : '?';
                    markup += vehicle.required + "x " + vehicleData[vehicleId][0] + ' (' + vehicle.probability + '%)<br>';
                };
                markup += '</div>';
                if (mission.avg_creds) {
                    markup += '<span class="badge">' + I18n.t('lssm.missionHelper.credits') + ': ~ ' + mission.avg_creds + '</span>';
                }
                if (mission.patients && mission.patients.probability) {
                    markup += '<span class="badge">' + I18n.t('lssm.missionHelper.transport_probability') + ': ' + mission.patients.probability +
                        ' % (' + mission.patients.department + ')</span>';
                }
                $('#lssm-missionhelper-content').append(markup);
                $('#lssm-missionhelper-spinner').hide();
            }
        });
    }

})();
