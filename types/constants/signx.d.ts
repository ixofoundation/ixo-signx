export declare const SIGN_X_LOGIN = "SIGN_X_LOGIN";
export declare const SIGN_X_LOGIN_SUCCESS = "SIGN_X_LOGIN_SUCCESS";
export declare const SIGN_X_LOGIN_ERROR = "SIGN_X_LOGIN_ERROR";
export declare const SIGN_X_CLEAN_DEEPLINK = "SIGN_X_CLEAN_DEEPLINK";
export declare const SIGN_X_TRANSACT = "SIGN_X_TRANSACT";
export declare const SIGN_X_TRANSACT_SUCCESS = "SIGN_X_TRANSACT_SUCCESS";
export declare const SIGN_X_TRANSACT_ERROR = "SIGN_X_TRANSACT_ERROR";
export declare const SIGN_X_TRANSACT_SESSION_STARTED = "SIGN_X_TRANSACT_SESSION_STARTED";
export declare const SIGN_X_TRANSACT_SESSION_NEW_TRANSACTION = "SIGN_X_TRANSACT_SESSION_NEW_TRANSACTION";
export declare const SIGN_X_TRANSACT_SESSION_ENDED = "SIGN_X_TRANSACT_SESSION_ENDED";
export declare const LOGIN_VERSION = 1;
export declare const TRANSACT_VERSION = 2;
export declare const ROUTES: {
    login: {
        fetch: string;
    };
    transact: {
        create: string;
        add: string;
        response: string;
        next: string;
    };
};
