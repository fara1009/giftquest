from pathlib import Path
import json

root = Path(__file__).resolve().parents[1] / 'dist'
assets = root / 'assets'
(assets / 'data').mkdir(parents=True, exist_ok=True)

# Both languages share keys. Every interface string is loaded from this JSON at runtime.
pairs = {
'home': ('Главная','Home'), 'game': ('Моя игра','My game'), 'profile': ('Анкеты','Wish profiles'),
'recipient': ('Мой получатель','My recipient'), 'catalog': ('Идеи подарков','Gift ideas'), 'preparation': ('Мой подарок','My gift'),
'skip': ('К содержимому','Skip to content'), 'menu': ('Меню','Menu'), 'lang': ('Язык сайта','Website language'),
'tagline': ('Маленькие секреты. Большая радость.','Little secrets. A lot of joy.'),
'demoBadge': ('Локальная демоверсия','Local demo'), 'demoNote': ('Одна игра, один браузер. Анкеты и результаты доступны при переключении участников.','One game, one browser. Profiles and results are accessible when switching participants.'),
'heroEyebrow': ('ПОДАРКИ, В КОТОРЫХ ЕСТЬ ЗАБОТА','A LITTLE THOUGHT GOES A LONG WAY'),
'heroTitle': ('Немного тайны.','A little mystery.'), 'heroItalic': ('Много тепла.','A lot of warmth.'),
'heroText': ('Соберите своих людей, вытяните тайное имя и найдите подарок, который скажет: «Я о тебе подумал».','Gather your favorite people, draw a secret name and find a gift that says, “I thought of you.”'),
'createGame': ('Создать игру','Create a game'), 'tryDemo': ('Попробовать пример','Try the demo'),
'continueGame': ('Вернуться к игре','Back to my game'), 'noAccount': ('Без регистрации · 3–12 участников','No account needed · 3–12 people'),
'heroSticker': ('Для кого-то особенного','For someone special'), 'heroStamp': ('ОТ ВСЕГО СЕРДЦА','WITH A LITTLE LOVE'),
'howEyebrow': ('ВСЁ НАЧИНАЕТСЯ С ВАС','IT STARTS WITH YOUR PEOPLE'),
'howTitle': ('Три шага до чьей-то улыбки','Three steps to someone’s smile'),
'step1Title': ('Соберите свой круг','Gather your circle'), 'step1Text': ('Задайте бюджет и дату. Добавьте друзей и их маленькие пожелания.','Set a budget and a date. Add friends and their little wishes.'),
'step2Title': ('Доверьтесь случаю','Leave it to chance'), 'step2Text': ('Проведите жеребьёвку: каждый дарит одному человеку и получает один подарок.','Draw names: everyone gives to one person and receives one gift.'),
'step3Title': ('Попадите в самое сердце','Make it personal'), 'step3Text': ('Подберите подарок по интересам и подготовьте его с заботой.','Find a gift that fits their interests and prepare it with care.'),
'curatedEyebrow': ('НЕБОЛЬШАЯ ПОДСКАЗКА ДЛЯ САНТЫ','A LITTLE INSPIRATION FOR SANTA'),
'curatedTitle': ('Хорошие идеи уже здесь','Good ideas start here'), 'allIdeas': ('Все идеи','Explore all ideas'),
'quote': ('Самый тёплый подарок — тот, в котором вас узнали.','The warmest gift is the one that feels like you.'),
'faqTitle': ('Прежде чем завязать бант','Before you tie the ribbon'),
'faq1': ('Нужно ли создавать аккаунт?','Do I need an account?'), 'faq1a': ('Нет. Это учебная демоверсия: игра сохраняется в текущем браузере. Для проверки сценария можно переключаться между участниками.','No. This student demo saves the game in the current browser. You can switch participants to explore the full experience.'),
'faq2': ('Как подбираются подарки?','How are gifts recommended?'), 'faq2a': ('Сначала мы учитываем бюджет и исключаем нежелательные категории. Затем сравниваем интересы и предпочтения с тегами подарков и объясняем совпадения.','We first apply the budget and exclude unwanted categories. Then we match interests and preferences against gift tags and explain the matches.'),
'faq3': ('Можно ли играть с разных телефонов?','Can we play on different phones?'), 'faq3a': ('Пока нет: данные не синхронизируются между устройствами. Для настоящей игры с личным доступом понадобится серверная версия.','Not yet: data does not sync between devices. A real game with private access needs a server-backed version.'),
'footerNote': ('Учебный проект · HTML, CSS, Bootstrap, JavaScript и jQuery','Student project · HTML, CSS, Bootstrap, JavaScript & jQuery'),
'priceNote': ('Цены ориентировочные. Это идеи подарков, а не предложения магазинов.','Prices are illustrative. These are gift ideas, not store offers.'),
'newGameEyebrow': ('ПРИГЛАСИТЕ ПРАЗДНИК','MAKE ROOM FOR A LITTLE MAGIC'),
'newGameTitle': ('У каждой игры — своя история','Every game has a story'),
'newGameText': ('Начните с названия, бюджета и даты. Участников добавим следующим шагом.','Start with a name, budget and date. We’ll add your people next.'),
'gameTitleLabel': ('Название игры','Game name'), 'gamePlaceholder': ('Например, Тёплый круг','For example, The cozy circle'),
'budget': ('Бюджет на подарок','Gift budget'), 'currency': ('тенге','tenge'), 'exchangeDate': ('Дата обмена подарками','Gift exchange date'),
'deadline': ('Анкеты заполнить до','Wish profiles due by'), 'create': ('Создать мой круг','Create my circle'),
'gameAsideTitle': ('У каждой истории есть правила','Every story has a few rules'),
'gameAsideText': ('Договоритесь о комфортной сумме и дате. Участники смогут рассказать об интересах и пожеланиях.','Agree on a comfortable budget and a date. Everyone can share their interests and wishes.'),
'rule1': ('Каждому — один получатель','One recipient for everyone'), 'rule2': ('Никто не дарит самому себе','No one draws their own name'), 'rule3': ('Результат сохраняется в браузере','The result stays in this browser'),
'titleError': ('Введите название от 2 до 60 символов.','Enter a name between 2 and 60 characters.'),
'budgetError': ('Укажите бюджет от 100 до 1 000 000 ₸.','Enter a budget between ₸100 and ₸1,000,000.'),
'dateError': ('Выберите сегодняшнюю или будущую дату.','Choose today or a future date.'),
'deadlineError': ('Срок анкет должен быть не раньше сегодня и не позже обмена.','The profile deadline must be today or later, and no later than the exchange.'),
'gameCreated': ('Ваш круг создан. Добавим участников!','Your circle is ready. Let’s add people!'),
'myCircle': ('ВАШ ТЁПЛЫЙ КРУГ','YOUR COZY CIRCLE'), 'collecting': ('Собираем пожелания','Collecting wishes'), 'drawn': ('Имена распределены','Names are drawn'),
'participants': ('Участники','Participants'), 'readyCount': ('Анкет готово','Profiles ready'), 'peopleLimit': ('От 3 до 12 человек','3 to 12 people'),
'addPerson': ('Добавить участника','Add a participant'), 'personName': ('Имя или ник','Name or nickname'), 'personPlaceholder': ('Например, Алина','For example, Alex'),
'add': ('Добавить','Add'), 'nameError': ('Введите имя от 2 до 30 символов.','Enter a name between 2 and 30 characters.'),
'duplicateName': ('Участник с таким именем уже есть. Добавьте фамилию или ник.','That name is already in the circle. Add a surname or nickname.'),
'maxPeople': ('В демонстрационной игре может быть до 12 участников.','This demo supports up to 12 participants.'),
'added': ('Участник добавлен','Participant added'), 'fillProfile': ('Заполнить анкету','Fill wish profile'), 'editProfile': ('Изменить анкету','Edit wish profile'),
'profileReady': ('Пожелания готовы','Wishes are ready'), 'profileMissing': ('Ждём пожелания','Waiting for wishes'), 'remove': ('Удалить','Remove'),
'drawTitle': ('Кому достанется ваша забота?','Who will receive your kindness?'),
'drawText': ('Когда все заполнят анкеты, можно распределить тайные имена.','Once everyone has shared their wishes, you can draw secret names.'),
'drawButton': ('Провести жеребьёвку','Draw secret names'), 'drawNeed': ('Добавьте минимум 3 участников и заполните все анкеты.','Add at least 3 people and complete every profile.'),
'drawSuccess': ('Жеребьёвка завершена. У каждого появился получатель.','The draw is complete. Everyone has a recipient.'),
'locked': ('Состав зафиксирован после жеребьёвки. Пожелания всё ещё можно редактировать.','The participant list is locked after the draw. Wishes can still be edited.'),
'openRecipient': ('Открыть получателя','Reveal my recipient'), 'editRules': ('Изменить правила','Edit game details'),
'copyInvite': ('Скопировать приглашение','Copy invitation'), 'copied': ('Скопировано','Copied'), 'copyFailed': ('Не удалось скопировать. Можно выделить текст в окне.','Could not copy. You can select the text in the dialog.'),
'inviteDemo': ('Для локальной демонстрации анкету заполняем вместе на одном устройстве.','For this local demo, we fill profiles together on one device.'),
'newRound': ('Начать новую игру','Start a new game'), 'resetTitle': ('Начать новую историю?','Start a new story?'),
'resetText': ('Текущая игра, жеребьёвка и сохранённые подарки будут заменены. Сначала можно скачать резервную копию.','The current game, draw and saved gifts will be replaced. You can download a backup first.'),
'replaceDemo': ('Загрузить пример игры?','Load the example game?'), 'cancel': ('Отмена','Cancel'), 'confirm': ('Продолжить','Continue'),
'close': ('Закрыть','Close'), 'saved': ('Изменения сохранены','Changes saved'), 'save': ('Сохранить','Save'),
'emptyPeople': ('В вашем круге пока тихо','Your circle is waiting'), 'emptyPeopleText': ('Добавьте первого участника — с него начнётся история.','Add your first person and let the story begin.'),
'profileEyebrow': ('ПОДСКАЗКИ ДЛЯ ВАШЕГО САНТЫ','A FEW HINTS FOR YOUR SANTA'), 'profileTitle': ('Расскажите, что вас радует','Tell us what brings you joy'),
'profileText': ('Несколько деталей помогут выбрать подарок с вашим характером.','A few little details will help someone find a gift that feels like you.'),
'viewAs': ('Сейчас вы —','You are viewing as'), 'roleNote': ('Переключение участников доступно для демонстрации.','Participant switching is available for this demo.'),
'interests': ('Что вам интересно?','What are you into?'), 'interestsHint': ('Выберите от 1 до 5 интересов.','Choose 1 to 5 interests.'),
'styles': ('Какие подарки вы любите?','What kind of gifts do you love?'), 'stylesHint': ('Выберите хотя бы один вариант.','Choose at least one option.'),
'avoid': ('Что лучше не дарить?','What would you rather skip?'), 'avoidHint': ('Эти категории не попадут в рекомендации.','These categories will be excluded from recommendations.'),
'wishes': ('Ваш маленький вишлист','Your little wish list'), 'wishesPlaceholder': ('Скетчбук, интересная книга или что-то для уютного вечера…','A sketchbook, a good book or something for a cozy evening…'),
'note': ('Записка для Санты','A note for Santa'), 'notePlaceholder': ('Цвета, детали или пожелания, которые стоит знать','Favorite colors, details or wishes worth knowing'),
'optional': ('Необязательно','Optional'), 'saveProfile': ('Сохранить пожелания','Save my wishes'),
'interestsError': ('Выберите от 1 до 5 интересов.','Choose between 1 and 5 interests.'), 'stylesError': ('Выберите хотя бы один тип подарка.','Choose at least one gift style.'),
'profileSaved': ('Пожелания сохранены. Ваш Санта скажет спасибо!','Wishes saved. Your Santa will thank you!'),
'profileAside': ('Хороший подарок начинается с маленькой подсказки.','A thoughtful gift starts with a little hint.'),
'profileAsideText': ('Не нужно составлять идеальный список. Достаточно рассказать о том, что делает обычный день чуть приятнее.','No need for a perfect wish list. Just share what makes an ordinary day a little brighter.'),
'noGame': ('Сначала соберём ваш круг','Let’s gather your circle first'), 'noGameText': ('Создайте игру или попробуйте готовый пример, чтобы пройти весь путь.','Create a game or try the example to explore the full experience.'),
'noPerson': ('Сначала добавьте участника','Add a participant first'),
'recipientEyebrow': ('ВАШ МАЛЕНЬКИЙ СЕКРЕТ','YOUR LITTLE SECRET'), 'recipientTitle': ('Чьим Сантой вы станете?','Whose Santa will you be?'),
'recipientText': ('Выберите участника и откройте его конверт.','Choose a participant and open their envelope.'),
'sealed': ('Внутри — кое-кто особенный','Someone special is inside'), 'reveal': ('Открыть конверт','Open the envelope'),
'notDrawn': ('Секрет ещё не выбран','The secret is still waiting'), 'notDrawnText': ('Завершите анкеты и проведите жеребьёвку на странице игры.','Complete the profiles and draw names on the game page.'),
'youGive': ('ВЫ ДАРИТЕ ПОДАРОК','YOU ARE GIVING TO'), 'hideRecipient': ('Скрыть имя','Hide the name'),
'theirWishes': ('Маленькие пожелания','Little wishes'), 'theirNote': ('Личная записка','A personal note'),
'noWishes': ('Конкретных пожеланий нет — можно довериться интересам.','No specific wishes yet — let their interests inspire you.'),
'pickedFor': ('Идеи с заботой о получателе','Thoughtfully picked for your recipient'),
'recommendText': ('В пределах бюджета, с учётом интересов и исключений.','Within your budget, with interests and exclusions in mind.'),
'why': ('Почему подходит','Why it fits'), 'interestReason': ('Совпадает с интересом','Matches an interest'), 'styleReason': ('Любимый формат','A preferred style'),
'budgetReason': ('Укладывается в бюджет','Fits the budget'), 'another': ('Другие идеи','More ideas'),
'noMatches': ('Подходящих идей пока нет','No matching ideas yet'), 'noMatchesText': ('В каталоге нет подарков в этом бюджете с выбранными исключениями. Можно подготовить подарок своими руками или обсудить пожелания.','The catalog has no gifts within this budget and these exclusions. Consider making something by hand or discussing their wishes.'),
'catalogEyebrow': ('ВДОХНОВЕНИЕ В МАЛЕНЬКИХ ВЕЩАХ','INSPIRATION IN LITTLE THINGS'), 'catalogTitle': ('Для каждого найдётся своё','A little something for everyone'),
'catalogText': ('Полезное, уютное, неожиданное. Найдите идею, которую хочется завернуть в бумагу.','Useful, cozy, unexpected. Find an idea you can’t wait to wrap.'),
'search': ('Поиск подарка','Search gift ideas'), 'searchPlaceholder': ('Скетчбук, чай, настольная игра…','Sketchbook, tea, a board game…'),
'allCategories': ('Все категории','All categories'), 'category': ('Категория','Category'), 'upTo': ('Цена до, ₸','Price up to, ₸'),
'sort': ('Сортировка','Sort by'), 'sortDefault': ('Сначала вдохновение','Curated order'), 'priceAsc': ('Сначала дешевле','Price: low to high'), 'priceDesc': ('Сначала дороже','Price: high to low'), 'nameAsc': ('По названию','Name'),
'found': ('Найдено идей','Ideas found'), 'resetFilters': ('Сбросить фильтры','Reset filters'), 'emptySearch': ('Такого подарка пока не нашли','No gifts found this time'), 'emptySearchText': ('Попробуйте другой запрос или увеличьте бюджет.','Try a different search or increase the budget.'),
'details': ('Подробнее','View details'), 'favorite': ('Сохранить идею','Save idea'), 'unfavorite': ('Убрать из сохранённого','Unsave idea'),
'favoriteAdded': ('Идея сохранена в «Мой подарок»','Idea saved to My gift'), 'favoriteRemoved': ('Идея убрана из сохранённого','Idea removed from saved gifts'),
'chooseGift': ('Выбрать этот подарок','Choose this gift'), 'giftChosen': ('Подарок выбран. Теперь добавим немного заботы.','Gift chosen. Now for a little extra care.'),
'chosen': ('Ваш выбор','Your choice'), 'approxPrice': ('Ориентировочная стоимость','Illustrative price'), 'giftTip': ('Добавьте личную записку: именно она делает подарок вашим.','Add a personal note: it’s the little detail that makes the gift yours.'),
'preparationEyebrow': ('ОСТАЛОСЬ ЗАВЯЗАТЬ БАНТ','TIME TO TIE THE RIBBON'), 'preparationTitle': ('Подарок начинается с заботы','A gift begins with a little care'),
'preparationText': ('Соберите идеи, выберите одну и подготовьте маленькое чудо.','Collect ideas, choose one and prepare a little moment of joy.'),
'savedIdeas': ('Сохранённые идеи','Saved ideas'), 'noSaved': ('Первую идею ещё предстоит найти','Your first idea is waiting'), 'noSavedText': ('Сохраняйте понравившиеся подарки сердечком в каталоге или рекомендациях.','Tap the heart on a gift in the catalog or recommendations to save it.'),
'checklist': ('Последние штрихи','The finishing touches'), 'taskChosen': ('Подарок выбран','Gift chosen'), 'taskBought': ('Подготовлен или куплен','Prepared or purchased'), 'taskWrapped': ('Упакован с заботой','Wrapped with care'), 'taskDelivered': ('Вручён с улыбкой','Given with a smile'),
'progress': ('Готовность подарка','Gift preparation'), 'finished': ('Вы подарили кому-то тёплый момент. Спасибо, Санта!','You made someone’s day a little warmer. Thank you, Santa!'),
'noChosen': ('Выберите подарок из сохранённых идей.','Choose a gift from your saved ideas.'),
'changeGiftTitle': ('Выбрать другой подарок?','Choose a different gift?'), 'changeGiftText': ('Отметки подготовки текущего подарка будут сброшены.','Preparation checkmarks for the current gift will be reset.'),
'copyCard': ('Скопировать поздравление','Copy a little greeting'), 'cardText': ('Пусть этот маленький подарок сделает твой день чуть теплее. От твоего Тайного Санты ♥','May this little gift make your day a little warmer. From your Secret Santa ♥'),
'backup': ('Скачать копию игры','Download game backup'), 'restore': ('Восстановить из файла','Restore from file'),
'backupNote': ('Копия содержит анкеты и результаты жеребьёвки. Храните её у себя.','The backup contains profiles and draw results. Keep it to yourself.'),
'restoreTitle': ('Восстановить сохранённую игру?','Restore the saved game?'), 'restoreText': ('Текущие данные будут заменены данными из выбранного файла.','Your current data will be replaced with the selected file.'),
'invalidBackup': ('Этот файл не является корректной копией GiftQuest.','This file is not a valid GiftQuest backup.'),
'storageError': ('Браузер не разрешил сохранение. Скачайте копию игры перед закрытием страницы.','Your browser blocked saving. Download a game backup before closing this page.'),
'dataRecovered': ('Сохранённые данные повреждены. Можно создать игру заново или восстановить копию.','Saved data is invalid. Create a new game or restore a backup.'),
'loadError': ('Не удалось загрузить каталог','Could not load the catalog'), 'loadErrorText': ('Проверьте соединение и попробуйте ещё раз. При локальном запуске нужен веб-сервер.','Check your connection and try again. A local web server is required when running locally.'),
'retry': ('Повторить','Try again'), 'backGame': ('К моей игре','Back to my game'),
'reading': ('Книги','Reading'), 'art': ('Творчество','Arts & crafts'), 'coffee': ('Чай и кофе','Tea & coffee'), 'gaming': ('Игры','Gaming'), 'sport': ('Спорт','Sports'),
'nature': ('Природа','Nature'), 'music': ('Музыка','Music'), 'cooking': ('Кулинария','Cooking'), 'travel': ('Путешествия','Travel'), 'cozy': ('Уют','Cozy moments'),
'useful': ('Полезные','Useful'), 'creative': ('Необычные','Creative'), 'experience': ('Впечатления','Experiences'), 'handmade': ('Своими руками','Handmade'),
'books': ('Книги и истории','Books & stories'), 'stationery': ('Для творчества','Creative supplies'), 'food': ('Вкусные подарки','Food & drinks'),
'games': ('Игры и головоломки','Games & puzzles'), 'decor': ('Для дома','Home & decor'), 'accessories': ('Аксессуары','Accessories'), 'tech': ('Техника','Tech'),
'removePersonTitle': ('Убрать участника из круга?','Remove this participant?'), 'removePersonText': ('Его анкета и сохранённые идеи будут удалены из этой игры.','Their profile and saved ideas will be removed from this game.'),
'demoLoaded': ('Пример готов. Можно сразу провести жеребьёвку.','The example is ready. You can draw names now.'),
'demoTitle': ('Тёплый круг','The cozy circle'), 'viewCatalog': ('Найти идею','Find an idea'), 'yourSanta': ('Твой Тайный Санта','Your Secret Santa'),
}
dictionary = {lang: {key: pair[i] for key, pair in pairs.items()} for i, lang in enumerate(['ru','en'])}
(assets/'data/i18n.json').write_text(json.dumps(dictionary, ensure_ascii=False, indent=2), encoding='utf-8')

# title RU / EN, description RU / EN, price, category, interest tags, styles, illustration
rows = [
('Скетчбук для маленьких идей','A sketchbook for little ideas','Плотная бумага для рисунков, заметок и планов, которым пора появиться на свет.','Thick paper for drawings, notes and plans ready to come to life.',2500,'stationery','art travel','useful creative','notebook'),
('Набор цветных карандашей','A set of colored pencils','Несколько любимых цветов и повод провести вечер за рисованием.','Favorite colors and a reason to spend an evening drawing.',3500,'stationery','art','useful creative','pencils'),
('Акварельный набор','A watercolor set','Небольшая палитра для открыток, скетчей и творческих экспериментов.','A little palette for postcards, sketches and creative experiments.',5500,'stationery','art','creative useful','palette'),
('Книга с личной закладкой','A book with a personal bookmark','Выберите историю по интересам получателя и добавьте записку между страниц.','Choose a story around their interests and tuck a note between the pages.',4500,'books','reading cozy','useful cozy','book'),
('Закладка ручной работы','A handmade bookmark','Сделайте закладку с рисунком, любимым цветом или небольшой цитатой.','Make a bookmark with a drawing, favorite color or a little quote.',500,'books','reading art','handmade useful','bookmark'),
('Читательский дневник','A reading journal','Место для впечатлений, любимых фраз и списка будущих историй.','A home for impressions, favorite lines and stories still to read.',3000,'books','reading','useful cozy','notebook'),
('Чайная коллекция','A little tea collection','Несколько видов чая для неспешных вечеров и разговоров.','A selection of teas for slow evenings and good conversations.',3000,'food','coffee cozy','cozy useful','tea'),
('Кофе для нового утра','Coffee for a fresh morning','Небольшая пачка кофе и записка с пожеланием хорошего дня.','A small bag of coffee and a note wishing them a lovely day.',4500,'food','coffee','useful cozy','coffee'),
('Керамическая чашка','A ceramic cup','Простая чашка приятного цвета для ежедневного маленького ритуала.','A simple cup in a lovely color for an everyday little ritual.',3500,'decor','coffee cozy','useful cozy','mug'),
('Набор для какао','A cozy cocoa kit','Какао, небольшие добавки и рецепт любимого зимнего напитка.','Cocoa, little toppings and a recipe for a favorite winter drink.',2500,'food','coffee cooking cozy','cozy creative','mug'),
('Печенье в подарочной коробке','Homemade cookies in a gift box','Испеките печенье и приложите карточку с полным списком ингредиентов.','Bake cookies and include a card listing every ingredient.',1500,'food','cooking cozy','handmade cozy','cookies'),
('Набор пряностей','A spice collection','Небольшие баночки пряностей и три идеи, что с ними приготовить.','Little jars of spices and three ideas for cooking with them.',3500,'food','cooking','useful creative','jars'),
('Карточки семейных рецептов','Handwritten recipe cards','Соберите проверенные рецепты в красивую небольшую подборку.','Gather tried-and-loved recipes into a lovely little collection.',700,'stationery','cooking art','handmade useful','notebook'),
('Компактная настольная игра','A pocket-sized board game','Игра для компании, которую удобно взять в гости или поездку.','A game for friends that travels easily to a gathering or a weekend away.',6000,'games','gaming travel','creative experience','game'),
('Деревянная головоломка','A wooden puzzle','Небольшая задача для любопытных рук и спокойного вечера.','A little challenge for curious hands and a peaceful evening.',2500,'games','gaming','creative useful','puzzle'),
('Пазл на уютный вечер','A puzzle for a cozy evening','Выберите сюжет по интересам получателя и собирайте его без спешки.','Choose a scene they love and piece it together without a rush.',4500,'games','gaming art cozy','cozy creative','puzzle'),
('Приглашение на игровой вечер','A homemade game-night invitation','Подготовьте игры, маленькие закуски и открытку с приглашением.','Prepare games, little snacks and a handwritten invitation.',2000,'experience','gaming cozy','experience handmade','ticket'),
('Маленькое растение','A little potted plant','Неприхотливое растение и простая памятка по уходу от продавца.','An easy-care plant with simple care instructions from the seller.',3500,'decor','nature cozy','useful cozy','plant'),
('Набор для выращивания зелени','A little herb-growing kit','Горшочек, грунт и семена — небольшой сад на подоконнике.','A pot, soil and seeds for a little windowsill garden.',3000,'decor','nature cooking','creative useful','plant'),
('Подставка под чашку','A handmade coaster','Небольшая подставка из доступных материалов с личным рисунком.','A little coaster made from simple materials with a personal design.',800,'decor','art coffee cozy','handmade useful','mug'),
('Тёплый плед','A warm throw','Мягкий плед спокойного цвета для чтения и кино по вечерам.','A soft throw in a peaceful color for evenings with books and films.',8000,'decor','cozy reading','cozy useful','blanket'),
('Небольшой ночник','A little night light','Мягкий свет для уютного уголка и вечернего настроения.','Soft light for a cozy corner and a peaceful evening mood.',6000,'tech','cozy reading','cozy useful','lamp'),
('Многоразовая бутылка','A reusable water bottle','Компактная бутылка для прогулок, занятий и повседневных дел.','A compact bottle for walks, exercise and everyday adventures.',4500,'accessories','sport nature travel','useful','bottle'),
('Спортивное полотенце','A compact sports towel','Лёгкое полотенце, которое удобно положить в спортивную сумку.','A lightweight towel that fits neatly in a gym bag.',3000,'accessories','sport travel','useful','blanket'),
('Эспандер для разминки','A light resistance band','Небольшой аксессуар для человека, который уже любит тренировки.','A little accessory for someone who already enjoys working out.',2500,'accessories','sport','useful','ribbon'),
('Обложка для документов','A travel document cover','Аккуратная обложка для документов и маленьких планов на поездку.','A neat cover for documents and little travel plans.',3000,'accessories','travel','useful','notebook'),
('Тканевый шопер с рисунком','A hand-decorated tote bag','Однотонная сумка и собственный рисунок краской для ткани.','A plain tote bag with your own fabric-paint design.',2000,'accessories','art nature travel','handmade useful','bag'),
('Карманный органайзер','A little travel organizer','Место для проводов, небольших аксессуаров и важных мелочей.','A place for cables, small accessories and important little things.',3500,'accessories','travel gaming','useful','bag'),
('Подставка для телефона','A phone stand','Простой помощник для рабочего стола и видеозвонков.','A simple little helper for a desk and video calls.',2000,'tech','gaming music','useful','phone'),
('Небольшая колонка','A small speaker','Компактная колонка для музыки дома или на небольшой встрече.','A compact speaker for music at home or a small gathering.',10000,'tech','music travel','useful creative','speaker'),
('Музыкальная открытка','A handwritten music postcard','Составьте плейлист и напишите, почему каждая песня напомнила вам о человеке.','Make a playlist and write why each song made you think of them.',300,'stationery','music art','handmade creative','ticket'),
('Билет на локальное событие','A ticket to a local event','Выберите событие по интересам и заранее согласуйте удобную дату.','Pick an event around their interests and agree on a suitable date.',7000,'experience','music art','experience','ticket'),
('Творческий мастер-класс','A creative workshop','Возможность попробовать новый материал или сделать небольшую вещь.','A chance to try a new material or make something with their hands.',12000,'experience','art','experience creative','palette'),
('Прогулка с маленьким пикником','A walk and a little picnic','Составьте маршрут и приготовьте небольшой перекус на двоих.','Plan a route and prepare a little snack for two.',2500,'experience','nature travel cozy','experience handmade','bag'),
('Коробка добрых записок','A box of kind little notes','Напишите воспоминания, благодарности и пожелания на отдельных карточках.','Write memories, thank-yous and wishes on individual little cards.',500,'stationery','cozy art','handmade cozy','gift'),
('Набор красивых открыток','A set of illustrated postcards','Небольшая коллекция открыток для вдохновения или писем друзьям.','A little postcard collection for inspiration or letters to friends.',2000,'stationery','art travel reading','creative cozy','ticket'),
]
gifts=[]
for i,row in enumerate(rows):
    ru,en,dr,de,price,cat,tags,styles,art=row
    gifts.append(dict(id=f'gift-{i+1:02}',title=dict(ru=ru,en=en),description=dict(ru=dr,en=de),price=price,category=cat,tags=tags.split(),styles=styles.split(),art=art))
(assets/'data/gifts.json').write_text(json.dumps(gifts,ensure_ascii=False,indent=2),encoding='utf-8')

for name,title in [('index','Главная'),('game','Моя игра'),('profile','Анкеты'),('recipient','Мой получатель'),('catalog','Идеи подарков'),('preparation','Мой подарок')]:
    html=f'''<!doctype html>
<html lang="ru"><head>
  <meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="description" content="GiftQuest — уютный Тайный Санта: соберите круг друзей, поделитесь пожеланиями и найдите подарок с заботой.">
  <meta name="theme-color" content="#23483e"><title>{title} — GiftQuest</title>
  <link rel="icon" href="assets/favicon.svg" type="image/svg+xml">
  <link rel="stylesheet" href="assets/vendor/bootstrap.min.css"><link rel="stylesheet" href="assets/style.css">
  <script defer src="assets/vendor/jquery.min.js"></script><script defer src="assets/engine.js"></script><script defer src="assets/app.js"></script>
</head><body data-page="{name}">
  <a href="#main" class="skip-link">К содержимому / Skip to content</a>
  <header id="header"></header>
  <main id="main"><div class="loading" role="status"><span class="loading-gift">✧</span> GiftQuest…</div></main>
  <noscript><p class="container">Для игры включите JavaScript. / Please enable JavaScript to play.</p></noscript>
  <footer id="footer"></footer>
  <dialog id="dialog" aria-labelledby="dialog-title"></dialog>
  <div id="toast" class="toast-message" role="status" aria-live="polite" hidden></div>
</body></html>'''
    (root/f'{name}.html').write_text(html,encoding='utf-8')
print(f'Created {len(gifts)} gifts, {len(pairs)} translation keys and 6 pages.')
