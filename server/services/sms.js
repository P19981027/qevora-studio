const config = require('../config');
const JsonStore = require('../models/json-store');
const path = require('path');

const codesStore = new JsonStore('sms-codes.json');

function generateCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function cleanExpiredCodes(data) {
  const now = Date.now();
  for (const phone in data) {
    if (new Date(data[phone].expiresAt).getTime() < now) {
      delete data[phone];
    }
  }
  return data;
}

async function sendSms(phone, type = 'register') {
  // Validate phone format
  if (!/^1[3-9]\d{9}$/.test(phone)) {
    return { error: '手机号格式不正确' };
  }

  const data = cleanExpiredCodes(codesStore.read() || {});

  // Rate limiting
  const existing = data[phone];
  if (existing) {
    const elapsed = Date.now() - new Date(existing.sentAt).getTime();
    if (elapsed < 60000) {
      return { error: '发送过于频繁，请60秒后重试' };
    }
  }

  const code = generateCode();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

  data[phone] = { code, type, expiresAt, verified: false, sentAt: new Date().toISOString() };
  codesStore.write(data);

  if (config.smsMock) {
    console.log(`[SMS Mock] 手机号: ${phone}, 验证码: ${code}, 类型: ${type}`);
    return { success: true, message: '验证码已发送（开发模式）', code };
  }

  // Real Alibaba Cloud SMS
  try {
    const Dysmsapi = require('@alicloud/dysmsapi20170525');
    const OpenApi = require('@alicloud/openapi-client');
    const Util = require('@alicloud/tea-util');

    const clientConfig = new OpenApi.Config({
      accessKeyId: config.smsAccessKeyId,
      accessKeySecret: config.smsAccessKeySecret,
    });
    clientConfig.endpoint = 'dysmsapi.aliyuncs.com';
    const client = new Dysmsapi(clientConfig);

    const sendReq = new Dysmsapi.SendSmsRequest({
      phoneNumbers: phone,
      signName: config.smsSignName,
      templateCode: config.smsTemplateCode,
      templateParam: JSON.stringify({ code }),
    });

    const runtime = new Util.RuntimeOptions({});
    const result = await client.sendSmsWithOptions(sendReq, runtime);

    if (result.body.code !== 'OK') {
      console.error('SMS send failed:', result.body.message);
      return { error: '短信发送失败，请稍后重试' };
    }

    return { success: true, message: '验证码已发送' };
  } catch (err) {
    console.error('SMS service error:', err.message);
    return { error: '短信服务异常，请稍后重试' };
  }
}

function verifyCode(phone, code) {
  const data = cleanExpiredCodes(codesStore.read() || {});
  const record = data[phone];

  if (!record) return { error: '请先发送验证码' };
  if (new Date(record.expiresAt).getTime() < Date.now()) {
    delete data[phone];
    codesStore.write(data);
    return { error: '验证码已过期，请重新发送' };
  }
  if (record.code !== code) return { error: '验证码错误' };

  delete data[phone];
  codesStore.write(data);
  return { success: true };
}

module.exports = { sendSms, verifyCode };
