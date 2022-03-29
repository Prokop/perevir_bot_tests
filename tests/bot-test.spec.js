// @ts-check
const { test, expect } = require('@playwright/test');
const chance = require('chance').Chance();
const config = require('../config.json');

const START_COMMAND = '/start';
const SET_FAKES_COMMAND = '/setfakes ';
const SEND_FAKES_COMMAND = '/sendfakes';
const SET_BLACKSOURCE_COMMAND = '/setblacksource';
const SET_WHITESOURCE_COMMAND = '/setwhitesource';

const INITIAL_MESSAGE = 'Перевір - інформаційний бот для перевірки даних та повідомлення сумнівних новин.';
const CHECK_CONTENT_MESSAGE = 'Надішліть чи перешліть матеріали які бажаєте перевірити';
const STARTED_CONTENT_CHECK_MESSAGE = 'Ми нічого не знайшли або не бачили такого. Почали опрацьовувати цей запит';
const REQUEST_PENDING_MESSAGE = 'Команда вже обробляє даний запит. Повідомимо про результат згодом';
const REQUEST_TRUE_MESSAGE = 'Ваше звернення визначено як правдиве';
const REQUEST_FALSE_MESSAGE = 'Ваше звернення визначено як оманливе';
const REQUEST_REJECT_MESSAGE = 'На жаль, ми не можемо підтвердити чи спростувати цю інформацію';
const REQUEST_AUTODECLINE_MESSAGE = 'Високовірогідно - ФЕЙК, МАНІПУЛЯЦІЯ або ДЕЗІНФОРМАЦІЯ. Запит не перевірявся журналістами та фактчекерами і обробився автоматично.';
const REQUEST_AUTOCONFIRM_MESSAGE = 'Високовірогідно - ВІДПОВІДАЛЬНА ІНФОРМАЦІЯ або ПРАВДА. Запит не перевірявся журналістами та фактчекерами і обробився автоматично.';
const SEND_NEW_FAKES_MESSAGE = 'Надішліть нові фейки у відповідь на це повідомлення';
const CONFIRM_SEND_FAKES_MESSAGE = 'Надіслати актуальні фейки користувачам?';
const FAKES_SAVED_MESSAGE = 'Зміни збережено';
const PENDING_MESSAGE = '#pending';
const RESOLVED_TRUE_MESSAGE = '#resolved | #true | Правда'
const RESOLVED_FALSE_MESSAGE = '#resolved | #false | Фейк'
const RESOLVED_REJECT_MESSAGE = '#resolved | #reject | Відмова'
const AUTODECLINE_MESSAGE = '#autoDecline';
const AUTOCONFIRM_MESSAGE = '#autoConfirm';

const CHECK_CONTENT_OPTION = 'Перевірити контент';
const RELEVANT_FAKES_OPTION = '🔥 Актуальні фейки';
const TRUE_OPTION = 'Правда';
const FALSE_OPTION = 'Фейк';
const REJECT_OPTION = 'Відмова';
const LEAVE_COMMENT_OPTION = 'Залишити коментар';
const CHANGE_STATUS_OPTION = 'Змінити статус';
const DEFAULT_ANSWER_OPTION = 'Шаблонна відповідь';
const YES_OPTION = 'Так';
const NO_OPTION = 'Ні';
const UNSUBSCRIBE_OPTION = 'Відмовитися від підбірок';

// // RUN BELOW TEST TO PERFORM ONE-TIME LOGIN AND SAVE SESSION
// test.describe.only('Setup', () => {
//   test('Login and save session', async ({ page }) => {
//     await openTelegram(page);
//     // PERFORM QR CODE LOGIN MANUALLY
//     await expect(page.locator('input[class*="search"]')).toBeVisible();
//     await page.context().storageState({ path: 'storageState.json' });
//     await openChat(page, config.botName, config.botId);
//   });
// });

test.describe('Check pending request', () => {
  const textRequest = chance.paragraph({ sentences: 2 });

  test.beforeEach(async ({ page }) => {
    await openTelegram(page);
    await openChat(page, config.botName, config.botId);
    await startBot(page);
  });

  test('New request is marked as pending', async ({ page }) => {
    await selectKeyboardOption(page, CHECK_CONTENT_OPTION);
    await verifyLastMessageContainsText(page, CHECK_CONTENT_MESSAGE);

    await sendMessage(page, textRequest);
    await verifyLastMessageContainsText(page, STARTED_CONTENT_CHECK_MESSAGE);

    await openChat(page, config.moderatorsChannelName, config.moderatorsChannelId);
    await verifyLastMessageContainsReplyToText(page, textRequest);
    await verifyLastMessageContainsText(page, PENDING_MESSAGE);
    await verifyLastMessageHasReplyOptions(page, [FALSE_OPTION, REJECT_OPTION, TRUE_OPTION, LEAVE_COMMENT_OPTION]);
  });

  test('When user sends pending request second time, he receives correct message', async ({ page }) => {
    await sendMessage(page, textRequest);
    await verifyLastMessageContainsText(page, REQUEST_PENDING_MESSAGE);
  });
});

test.describe('Process true request', () => {
  const textRequest = chance.paragraph({ sentences: 2 });

  test.beforeEach(async ({ page }) => {
    await openTelegram(page);
    await openChat(page, config.botName, config.botId);
    await startBot(page);
  });

  test('Moderator is able to set new request as True', async ({ page }) => {
    await sendMessage(page, textRequest);
    await verifyLastMessageContainsText(page, STARTED_CONTENT_CHECK_MESSAGE);

    await openChat(page, config.moderatorsChannelName, config.moderatorsChannelId);
    await verifyLastMessageContainsReplyToText(page, textRequest);

    await selectLastMessageReplyOption(page, TRUE_OPTION);
    await verifyLastMessageContainsText(page, RESOLVED_TRUE_MESSAGE);
    await verifyLastMessageHasReplyOptions(page, [CHANGE_STATUS_OPTION, LEAVE_COMMENT_OPTION]);

    await openChat(page, config.botName, config.botId);
    await verifyLastMessageContainsReplyToText(page, textRequest);
    await verifyLastMessageContainsText(page, REQUEST_TRUE_MESSAGE);
  });

  test('When user sends true request second time, he receives correct message', async ({ page }) => {
    await sendMessage(page, textRequest);
    await verifyLastMessageContainsText(page, REQUEST_TRUE_MESSAGE);
  });
});

test.describe('Process false request', () => {
  const textRequest = chance.paragraph({ sentences: 2 });

  test.beforeEach(async ({ page }) => {
    await openTelegram(page);
    await openChat(page, config.botName, config.botId);
    await startBot(page);
  });

  test('Moderator is able to set new request as False', async ({ page }) => {
    await sendMessage(page, textRequest);
    await verifyLastMessageContainsText(page, STARTED_CONTENT_CHECK_MESSAGE);

    await openChat(page, config.moderatorsChannelName, config.moderatorsChannelId);
    await verifyLastMessageContainsReplyToText(page, textRequest);

    await selectLastMessageReplyOption(page, FALSE_OPTION);
    await verifyLastMessageContainsText(page, RESOLVED_FALSE_MESSAGE);
    await verifyLastMessageHasReplyOptions(page, [CHANGE_STATUS_OPTION, LEAVE_COMMENT_OPTION]);

    await openChat(page, config.botName, config.botId);
    await verifyLastMessageContainsReplyToText(page, textRequest);
    await verifyLastMessageContainsText(page, REQUEST_FALSE_MESSAGE);
  });

  test('When user sends false request second time, he receives correct message', async ({ page }) => {
    await sendMessage(page, textRequest);
    await verifyLastMessageContainsText(page, REQUEST_FALSE_MESSAGE);
  });
});

test.describe('Process rejected request', () => {
  const textRequest = chance.paragraph({ sentences: 2 });

  test.beforeEach(async ({ page }) => {
    await openTelegram(page);
    await openChat(page, config.botName, config.botId);
    await startBot(page);
  });

  test('Moderator is able to set new request as Rejected', async ({ page }) => {
    await sendMessage(page, textRequest);
    await verifyLastMessageContainsText(page, STARTED_CONTENT_CHECK_MESSAGE);

    await openChat(page, config.moderatorsChannelName, config.moderatorsChannelId);
    await verifyLastMessageContainsReplyToText(page, textRequest);

    await selectLastMessageReplyOption(page, REJECT_OPTION);
    await verifyLastMessageContainsText(page, RESOLVED_REJECT_MESSAGE);
    await verifyLastMessageHasReplyOptions(page, [CHANGE_STATUS_OPTION, LEAVE_COMMENT_OPTION, DEFAULT_ANSWER_OPTION]);

    await openChat(page, config.botName, config.botId);
    await verifyLastMessageContainsReplyToText(page, textRequest);
    await verifyLastMessageContainsText(page, REQUEST_REJECT_MESSAGE);
  });

  test('When user sends rejected request second time, he receives correct message', async ({ page }) => {
    await sendMessage(page, textRequest);
    await verifyLastMessageContainsText(page, REQUEST_REJECT_MESSAGE);
  });
});

test.describe('Comment request', () => {
  const textRequest1 = chance.paragraph({ sentences: 2 });
  const comment1 = chance.sentence({ words: 3 });
  const textRequest2 = chance.paragraph({ sentences: 2 });
  const comment2 = chance.sentence({ words: 3 });

  test.beforeEach(async ({ page }) => {
    await openTelegram(page);
    await openChat(page, config.botName, config.botId);
    await startBot(page);
  });

  test('Moderator is able to leave comment to new request', async ({ page }) => {
    await sendMessage(page, textRequest1);
    await verifyLastMessageContainsText(page, STARTED_CONTENT_CHECK_MESSAGE);

    await openChat(page, config.moderatorsChannelName, config.moderatorsChannelId);
    await verifyLastMessageContainsReplyToText(page, textRequest1);

    await selectLastMessageReplyOption(page, LEAVE_COMMENT_OPTION);
    await verifyLastMessageHasReplyOptions(page, [FALSE_OPTION, REJECT_OPTION, TRUE_OPTION, LEAVE_COMMENT_OPTION]);

    await openChat(page, config.botName, config.botId);
    await verifyLastMessageContainsReplyToText(page, textRequest1);
    await verifyLastMessageContainsText(page, '#comment');
    await verifyReplyWrapperAppeared(page);

    await sendMessage(page, comment1);
    await verifyLastMessageContainsReplyToText(page, textRequest1);
    await verifyLastMessageContainsText(page, comment1);
  });

  test('Moderator is abl to leave comment to resolved request', async ({ page }) => {
    await sendMessage(page, textRequest2);
    await verifyLastMessageContainsText(page, STARTED_CONTENT_CHECK_MESSAGE);

    await openChat(page, config.moderatorsChannelName, config.moderatorsChannelId);
    await verifyLastMessageContainsReplyToText(page, textRequest2);

    await selectLastMessageReplyOption(page, FALSE_OPTION);
    await verifyLastMessageContainsText(page, RESOLVED_FALSE_MESSAGE);

    await selectLastMessageReplyOption(page, LEAVE_COMMENT_OPTION);
    await verifyLastMessageHasReplyOptions(page, [CHANGE_STATUS_OPTION]);

    await openChat(page, config.botName, config.botId);
    await verifyLastMessageContainsReplyToText(page, textRequest2);
    await verifyLastMessageContainsText(page, '#comment');
    await verifyReplyWrapperAppeared(page);

    await sendMessage(page, comment2);
    await verifyLastMessageContainsReplyToText(page, textRequest2);
    await verifyLastMessageContainsText(page, comment2);
  });

  test('When user sends request with comment second time, he receives comment', async ({ page }) => {
    await sendMessage(page, textRequest2);
    await verifyLastMessageContainsText(page, comment2);
  });
});

test.describe('Change status', () => {
  const textRequest = chance.paragraph({ sentences: 2 });

  test('Moderator is able to change status of resolved request', async ({ page }) => {
    await openTelegram(page);
    await openChat(page, config.botName, config.botId);
    await startBot(page);

    await sendMessage(page, textRequest);
    await verifyLastMessageContainsText(page, STARTED_CONTENT_CHECK_MESSAGE);

    await openChat(page, config.moderatorsChannelName, config.moderatorsChannelId);
    await verifyLastMessageContainsReplyToText(page, textRequest);

    await selectLastMessageReplyOption(page, TRUE_OPTION);
    await verifyLastMessageContainsText(page, RESOLVED_TRUE_MESSAGE);

    await selectLastMessageReplyOption(page, CHANGE_STATUS_OPTION);
    await verifyLastMessageContainsText(page, PENDING_MESSAGE);
    await verifyLastMessageHasReplyOptions(page, [FALSE_OPTION, REJECT_OPTION, TRUE_OPTION, LEAVE_COMMENT_OPTION]);

    await openChat(page, config.botName, config.botId);
    await sendMessage(page, textRequest);
    await verifyLastMessageContainsText(page, REQUEST_PENDING_MESSAGE);
  });
});

test.describe('Relevant fakes', () => {
  const relevantFakes = chance.paragraph({ sentences: 2 });

  test.beforeEach(async ({ page }) => {
    await openTelegram(page);
    await openChat(page, config.botName, config.botId);
    await startBot(page);
  });

  test('Admin is able to change relevant fakes', async ({ page }) => {
    await sendMessage(page, SET_FAKES_COMMAND);
    await verifyLastMessageContainsText(page, SEND_NEW_FAKES_MESSAGE);
    await verifyReplyWrapperAppeared(page);
    await sendMessage(page, relevantFakes);
    await verifyMessageBeforeLastContainsText(page, 1, FAKES_SAVED_MESSAGE);
    await verifyLastMessageContainsText(page, relevantFakes);
  });

  test('Admin is able to send relevant fakes to user', async ({ page }) => {
    await sendMessage(page, SEND_FAKES_COMMAND);
    await verifyLastMessageContainsText(page, CONFIRM_SEND_FAKES_MESSAGE);
    await verifyLastMessageHasReplyOptions(page, [YES_OPTION, NO_OPTION]);

    await selectLastMessageReplyOption(page, YES_OPTION);
    await verifyLastMessageContainsText(page, relevantFakes);
  });

  test('User is able to request relevant fakes', async ({ page }) => {
    await selectKeyboardOption(page, RELEVANT_FAKES_OPTION);
    await verifyLastMessageContainsText(page, relevantFakes);
    await verifyLastMessageHasReplyOptions(page, [UNSUBSCRIBE_OPTION]);
  });
});

test.describe('Blacklist', () => {
  const domain = chance.domain();
  const description = chance.paragraph({ sentences: 1 });
  const url = chance.url({domain: domain});

  test.beforeEach(async ({ page }) => {
    await openTelegram(page);
    await openChat(page, config.botName, config.botId);
    await startBot(page);
  });

  test('Admin is able to add domain to blacklist', async ({ page }) => {
    await sendMessage(page, `${SET_BLACKSOURCE_COMMAND} https://${domain} ${description}`);
    await verifyLastMessageContainsText(page, `Домен ${domain} успішно додано. Опис: ${description}`);
  });

  test('Resource from blacklist is auto-declined', async ({ page }) => {
    await sendMessage(page, url);
    await verifyLastMessageContainsText(page, REQUEST_AUTODECLINE_MESSAGE);
    await verifyLastMessageContainsText(page, description);

    await openChat(page, config.moderatorsChannelName, config.moderatorsChannelId);
    await verifyLastMessageContainsReplyToText(page, url);
    await verifyLastMessageContainsText(page, AUTODECLINE_MESSAGE);
    await verifyLastMessageHasReplyOptions(page, [CHANGE_STATUS_OPTION, LEAVE_COMMENT_OPTION]);
  });
});

test.describe('Whitelist', () => {
  const domain = chance.domain();
  const description = chance.paragraph({ sentences: 1 });
  const url = chance.url({domain: domain});

  test.beforeEach(async ({ page }) => {
    await openTelegram(page);
    await openChat(page, config.botName, config.botId);
    await startBot(page);
  });

  test('Admin is able to add domain to whitelist', async ({ page }) => {
    await sendMessage(page, `${SET_WHITESOURCE_COMMAND} https://${domain} ${description}`);
    await verifyLastMessageContainsText(page, `Домен ${domain} успішно додано. Опис: ${description}`);
  });

  test('Resource from whitelist is auto-confirmed', async ({ page }) => {
    await sendMessage(page, url);
    await verifyLastMessageContainsText(page, REQUEST_AUTOCONFIRM_MESSAGE);
    await verifyLastMessageContainsText(page, description);

    await openChat(page, config.moderatorsChannelName, config.moderatorsChannelId);
    await verifyLastMessageContainsReplyToText(page, url);
    await verifyLastMessageContainsText(page, AUTOCONFIRM_MESSAGE);
    await verifyLastMessageHasReplyOptions(page, [CHANGE_STATUS_OPTION, LEAVE_COMMENT_OPTION]);
  });
});

/**
 * @param {import("playwright-core").Page} page
 */
async function openTelegram(page) {
  await page.goto(config.telegramUrl);
}

/**
 * @param {import("playwright-core").Page} page
 * @param {string} chatName
 * @param {string} chatId
 */
async function openChat(page, chatName, chatId) {
  await page.locator('input[class*="search"]').fill(chatName);
  await page.locator('input[class*="search"]').press('Enter');
  await page.locator(`[class*="search-group-contacts"] li[data-peer-id="${chatId}"]`).click();
  await expect(page.locator(`//div[@class="user-title"]/span[.="${chatName}"]`)).toBeVisible();
}

/**
 * @param {import("playwright-core").Page} page
 */
async function startBot(page) {
  if (await page.locator('//button[.="START"]').isVisible()) {
    await page.locator('//button[.="START"]').click();
  }
  else {
    await sendMessage(page, START_COMMAND);
  }
  await verifyLastMessageContainsText(page, INITIAL_MESSAGE);
}

/**
 * @param {import("playwright-core").Page} page
 * @param {string} message
 */
async function sendMessage(page, message) {
  await page.locator('[class*="input-message-input"]').first().fill(message);
  await page.locator('button[class*="send"]').click();
}

/**
 * @param {import("playwright-core").Page} page
 * @param {string} option
 */
async function selectKeyboardOption(page, option) {
  await page.locator('button[class*="toggle-reply-markup"]').hover();
  await page.locator(`//button[contains(@class,"reply-keyboard-button") and @data-text="${option}"]`).click();
}

/**
 * @param {import("playwright-core").Page} page
 * @param {string} option
 */
async function selectLastMessageReplyOption(page, option) {
  await page.locator('[class="bubble-content-wrapper"]').last().locator(`//button[contains(text(), "${option}")]`).click();
}

/**
 * @param {import("playwright-core").Page} page
 * @param {string} text
 */
async function verifyLastMessageContainsText(page, text) {
  await expect(page.locator('[class="bubble-content-wrapper"]').last().locator('[class="message"]')).toContainText(text);
}

/**
 * @param {import("playwright-core").Page} page
 * @param {number} messagePosition
 * @param {string} text
 */
async function verifyMessageBeforeLastContainsText(page, messagePosition, text) {
  await expect(page.locator(`(//div[@class="bubble-content-wrapper"])[last()-${messagePosition}]`).locator('[class="message"]')).toContainText(text);
}

/**
 * @param {import("playwright-core").Page} page
 * @param {string} text
 */
async function verifyLastMessageContainsReplyToText(page, text) {
  const trimmedText = text.substring(0, 100); //Reply subtitle doesn't contain full text
  await expect(page.locator('[class="bubble-content-wrapper"]').last().locator('[class="reply-subtitle"]')).toContainText(trimmedText);
}

/**
 * @param {import("playwright-core").Page} page
 * @param {string[]} expectedOptions
 */
async function verifyLastMessageHasReplyOptions(page, expectedOptions) {
  await expect(page.locator('(//div[@class="bubble-content-wrapper"])[last()]//button')).toHaveCount(expectedOptions.length);
  const actualOptions = await page.locator('(//div[@class="bubble-content-wrapper"])[last()]//button').allInnerTexts();
  expect(actualOptions.map(element => { return element.trim(); })).toEqual(expectedOptions);
}

/**
 * @param {import("playwright-core").Page} page
 */
async function verifyReplyWrapperAppeared(page) {
  await expect(page.locator('[class="reply-wrapper"]')).toBeVisible();
}