export const SIGN_X_LOGIN = 'SIGN_X_LOGIN';
export const SIGN_X_LOGIN_SUCCESS = 'SIGN_X_LOGIN_SUCCESS';
export const SIGN_X_LOGIN_ERROR = 'SIGN_X_LOGIN_ERROR';

export const SIGN_X_DATA = 'SIGN_X_DATA';
export const SIGN_X_DATA_SUCCESS = 'SIGN_X_DATA_SUCCESS';
export const SIGN_X_DATA_ERROR = 'SIGN_X_DATA_ERROR';

export const SIGN_X_CLEAN_DEEPLINK = 'SIGN_X_CLEAN_DEEPLINK';

export const SIGN_X_TRANSACT = 'SIGN_X_TRANSACT';
export const SIGN_X_TRANSACT_SUCCESS = 'SIGN_X_TRANSACT_SUCCESS';
export const SIGN_X_TRANSACT_ERROR = 'SIGN_X_TRANSACT_ERROR';

export const SIGN_X_TRANSACT_SESSION_STARTED = 'SIGN_X_TRANSACT_SESSION_STARTED';
export const SIGN_X_TRANSACT_SESSION_NEW_TRANSACTION = 'SIGN_X_TRANSACT_SESSION_NEW_TRANSACTION';
export const SIGN_X_TRANSACT_SESSION_ENDED = 'SIGN_X_TRANSACT_SESSION_ENDED';

export const SIGN_X_MATRIX_LOGIN = 'SIGN_X_MATRIX_LOGIN';
export const SIGN_X_MATRIX_LOGIN_SUCCESS = 'SIGN_X_MATRIX_LOGIN_SUCCESS';
export const SIGN_X_MATRIX_LOGIN_ERROR = 'SIGN_X_MATRIX_LOGIN_ERROR';

export const LOGIN_VERSION = 1;
export const TRANSACT_VERSION = 2;
export const DATA_VERSION = 1;
export const MATRIX_VERSION = 1;

export const ROUTES = {
	login: {
		fetch: '/login/fetch',
	},
	transact: {
		create: '/transaction/v2/create',
		add: '/transaction/v2/add',
		response: '/transaction/v2/response',
		next: '/transaction/v2/next',
	},
	data: {
		create: '/data/create',
		response: '/data/response',
	},
	matrix_login: {
		fetch: '/matrix/login/fetch',
	},
};
