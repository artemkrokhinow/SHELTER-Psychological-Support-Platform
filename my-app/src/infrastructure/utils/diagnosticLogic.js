import SosView from '../../pages/SOS/variants/SosView';
import BlueView from '../../pages/SOS/variants/BlueView';

const resultsMap = {
	emergency: { view: SosView, type: 'default' },
	1: { view: SosView, type: 'anxiety' },
	2: { view: BlueView, type: 'stress' },
	3: { view: BlueView, type: 'apathy' },

	'1,1': { view: SosView, type: 'anxiety' },
	'1,2': { view: SosView, type: 'anxiety' },
	'1,3': { view: SosView, type: 'anxiety' },

	'2,1': { view: BlueView, type: 'stress' },
	'2,2': { view: BlueView, type: 'stress' },
	'2,3': { view: BlueView, type: 'stress' },

	'3,1': { view: BlueView, type: 'apathy' },
	'3,2': { view: BlueView, type: 'apathy' },
	'3,3': { view: BlueView, type: 'apathy' },

	'1,1,1': { view: SosView, type: 'anxiety' },
	'1,1,2': { view: SosView, type: 'anxiety' },
	'1,1,3': { view: SosView, type: 'anxiety' },
	'1,2,1': { view: SosView, type: 'anxiety' },
	'1,2,2': { view: SosView, type: 'anxiety' },
	'1,2,3': { view: SosView, type: 'anxiety' },
	'1,3,1': { view: SosView, type: 'anxiety' },
	'1,3,2': { view: SosView, type: 'anxiety' },
	'1,3,3': { view: SosView, type: 'anxiety' },

	'2,1,1': { view: BlueView, type: 'stress' },
	'2,1,2': { view: BlueView, type: 'stress' },
	'2,1,3': { view: BlueView, type: 'stress' },
	'2,2,1': { view: BlueView, type: 'stress' },
	'2,2,2': { view: BlueView, type: 'stress' },
	'2,2,3': { view: BlueView, type: 'stress' },
	'2,3,1': { view: BlueView, type: 'stress' },
	'2,3,2': { view: BlueView, type: 'stress' },
	'2,3,3': { view: BlueView, type: 'stress' },

	'3,1,1': { view: BlueView, type: 'apathy' },
	'3,1,2': { view: BlueView, type: 'apathy' },
	'3,1,3': { view: BlueView, type: 'apathy' },
	'3,2,1': { view: BlueView, type: 'apathy' },
	'3,2,2': { view: BlueView, type: 'apathy' },
	'3,2,3': { view: BlueView, type: 'apathy' },
	'3,3,1': { view: BlueView, type: 'apathy' },
	'3,3,2': { view: BlueView, type: 'apathy' },
	'3,3,3': { view: BlueView, type: 'apathy' },
};

export const getDiagnosticConfig = answers => {
	if (!answers) return resultsMap['emergency'];
	const key = Array.isArray(answers) ? answers.join(',') : String(answers);
	return resultsMap[key] || resultsMap['emergency'];
};

export const getDiagnosticResult = answers => {
	return getDiagnosticConfig(answers).view;
};
