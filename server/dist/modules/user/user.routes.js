"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const user_controller_1 = require("./user.controller");
const auth_middleware_1 = require("../../middlewares/auth.middleware");
const validate_middleware_1 = require("../../middlewares/validate.middleware");
const user_validation_1 = require("./user.validation");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.requireAuth);
router.get('/me', user_controller_1.userController.getMe);
router.patch('/me', (0, validate_middleware_1.validate)(user_validation_1.updateProfileSchema), user_controller_1.userController.updateMe);
router.delete('/me', user_controller_1.userController.deleteMe);
router.get('/me/settings', user_controller_1.userController.getSettings);
router.patch('/me/settings', user_controller_1.userController.updateSettings);
exports.default = router;
//# sourceMappingURL=user.routes.js.map