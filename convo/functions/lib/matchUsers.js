"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.matchUsers = void 0;
const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();
exports.matchUsers = functions.https.onCall(async (request) => {
    const { auth } = request;
    if (!auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated to match.');
    }
    // Your matching logic here
    // ...
    return { message: "Matching logic not yet implemented" };
});
//# sourceMappingURL=matchUsers.js.map