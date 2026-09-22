"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const resume_controller_1 = require("./resume.controller");
const auth_middleware_1 = require("../../middlewares/auth.middleware");
const upload_middleware_1 = require("../../middlewares/upload.middleware");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.requireAuth);
router.post('/upload', upload_middleware_1.uploadResume, resume_controller_1.resumeController.upload);
router.get('/me', resume_controller_1.resumeController.getMine);
router.get('/:id', resume_controller_1.resumeController.getById);
exports.default = router;
//# sourceMappingURL=resume.routes.js.map