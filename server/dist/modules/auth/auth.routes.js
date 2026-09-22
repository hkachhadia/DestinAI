"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_1 = require("./auth.controller");
const validate_middleware_1 = require("../../middlewares/validate.middleware");
const auth_middleware_1 = require("../../middlewares/auth.middleware");
const rateLimiter_middleware_1 = require("../../middlewares/rateLimiter.middleware");
const auth_validation_1 = require("./auth.validation");
const router = (0, express_1.Router)();
router.post('/signup', rateLimiter_middleware_1.authRateLimiter, (0, validate_middleware_1.validate)(auth_validation_1.signupSchema), auth_controller_1.authController.signup);
router.post('/login', rateLimiter_middleware_1.authRateLimiter, (0, validate_middleware_1.validate)(auth_validation_1.loginSchema), auth_controller_1.authController.login);
router.post('/refresh', rateLimiter_middleware_1.authRateLimiter, (0, validate_middleware_1.validate)(auth_validation_1.refreshSchema), auth_controller_1.authController.refresh);
router.post('/logout', auth_middleware_1.requireAuth, auth_controller_1.authController.logout);
router.get('/me', auth_middleware_1.requireAuth, auth_controller_1.authController.me);
exports.default = router;
//# sourceMappingURL=auth.routes.js.map