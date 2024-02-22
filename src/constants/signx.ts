export const SIGN_X_LOGIN = 'SIGN_X_LOGIN';
export const SIGN_X_LOGIN_SUCCESS = 'SIGN_X_LOGIN_SUCCESS';
export const SIGN_X_LOGIN_ERROR = 'SIGN_X_LOGIN_ERROR';

export const SIGN_X_TRANSACT = 'SIGN_X_TRANSACT';
export const SIGN_X_TRANSACT_SUCCESS = 'SIGN_X_TRANSACT_SUCCESS';
export const SIGN_X_TRANSACT_ERROR = 'SIGN_X_TRANSACT_ERROR';

export const SIGN_X_TRANSACT_SESSION_STARTED = 'SIGN_X_TRANSACT_SESSION_STARTED';
export const SIGN_X_TRANSACT_SESSION_NEW_TRANSACTION = 'SIGN_X_TRANSACT_SESSION_NEW_TRANSACTION';
export const SIGN_X_TRANSACT_SESSION_ENDED = 'SIGN_X_TRANSACT_SESSION_ENDED';

export const LOGIN_VERSION = 1;
export const TRANSACT_VERSION = 2;

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
};
