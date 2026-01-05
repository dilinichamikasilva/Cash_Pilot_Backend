"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const analytics_controller_1 = require("../controller/analytics.controller");
const router = express_1.default.Router();
router.get("/summary", analytics_controller_1.getAnalyticsSummary);
exports.default = router;
