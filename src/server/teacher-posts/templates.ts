import type { CorePhrase, LessonDraft, MicroChallenge, VisualHook, WowPost } from "@/lib/teacher-posts/model";
const choice = (kind: "quiz" | "trap" | "reaction", prompt: string, options: string[], correctIndex: number, feedback: string, hint = "Сверьтесь с двумя фразами выше."): MicroChallenge => ({ kind, prompt, options, correctIndex, feedback, hint, acceptedAnswers: [] });
const fill = (prompt: string, acceptedAnswers: string[], feedback: string, hint: string): MicroChallenge => ({ kind: "fill", prompt, acceptedAnswers, feedback, hint, options: [], correctIndex: null });
const open = (prompt: string, hint: string): MicroChallenge => ({ kind: "open", prompt, hint, feedback: "Это ваша реплика, а не тест на единственный правильный ответ. Прочитайте её вслух; точность формулировки можно обсудить с преподавателем.", options: [], acceptedAnswers: [], correctIndex: null });
function pack(title: string, hook: string, example: string, explanation: string, visual: VisualHook, core: CorePhrase[], challenges: MicroChallenge[]): WowPost {
  const first = challenges[0];
  return { formatVersion: 2, title, hook, example, explanation, visual, core, challenges, interactiveQuestion: { question: first.prompt, options: first.options, correctIndex: first.correctIndex!, feedback: first.feedback } };
}
const visual = (template: VisualHook["template"], emotion: string, concept: string, caption: string, searchQuery: string): VisualHook => ({ template, emotion, concept, caption, searchQuery, mediaUrl: "" });
/** Curated editorial examples, selected only when their source phrases are present. Not AI. */
export function templatePost(draft: LessonDraft): WowPost {
  const source = `${draft.topic}\n${draft.sourceText}`.toLowerCase();
  if (source.includes("sin blanca") && source.includes("ojo de la cara")) return pack(
    "Билет за 300 €, на карте — 1 €. Испанский понимает твою боль",
    draft.tone === "humor" ? "Когда кошелёк уже плачет, а ценник решил добить тебя" : "Одно выражение — про пустой кошелёк. Другое — про цену, от которой хочется присесть.",
    "— ¿Vamos al concierto? La entrada cuesta 300 euros.\n— ¡Cuesta un ojo de la cara! Y además estoy sin blanca.\n— На концерт? Билет стоит 300 евро.\n— Это целое состояние! А я ещё и на мели.",
    "Открываешь афишу, уже представляешь себя у сцены… потом видишь цену и проверяешь баланс. Для этой маленькой драмы хватит двух фраз. «No tengo dinero» и «es muy caro» тоже нормальны: идиомы просто делают реакцию выразительнее. Глаза никто не теряет — это образ дороговизны.",
    visual("wallet", "шок от ценника и бессилие пустого кошелька", "Зацикленный мем: кот уверенно смотрит на билет, видит 300 €, затем на баланс 1 € и медленно теряет улыбку. Визуал про чувство, не про монеты или глаз.", "Хочу на концерт / Мой баланс: 1 €", "cat shocked price empty wallet reaction"),
    [{ phrase: "Estoy sin blanca", meaning: "Я на мели", note: "Разговорная фраза о нехватке денег, не о зрении." }, { phrase: "Cuesta un ojo de la cara", meaning: "Это стоит целое состояние", note: "Реакция на очень высокую цену." }],
    [choice("quiz", "Друг зовёт на концерт за 300 €. На карте 1 €. Какая реакция передаёт обе проблемы?", ["¡Cuesta un ojo de la cara! Y además estoy sin blanca.", "Tengo un ojo blanco para el concierto.", "Estoy sin blanca: he perdido un ojo."], 0, "Первая часть — про дорогой билет, вторая — про ваш бюджет."),
     choice("trap", "Поймай подмену смысла: какое пояснение неверно?", ["Estoy sin blanca — я на мели.", "Cuesta un ojo de la cara — это очень дорого.", "Estoy sin blanca — я ослеп на один глаз."], 2, "Sin blanca говорит о деньгах. О глазе упоминает другая идиома — и тоже не буквально."),
     fill("🍕 + 🧾 + 😱: ¡Cuesta un ____ de la cara! Одно слово — и весь счёт понятен.", ["ojo"], "Ojo: целиком — un ojo de la cara.", "Какой орган спрятался в идиоме?"),
     choice("reaction", "— ¿Vamos de compras? На карте 1 €. Выбери честную короткую реплику.", ["No puedo, estoy sin blanca.", "No puedo, tengo una cara blanca.", "No puedo, la blanca tiene mi ojo."], 0, "No puedo, estoy sin blanca — не могу, я на мели."),
     open("Что в последнее время стоило для вас целое состояние? Напишите одну реплику по-испански.", "Например, начните: El alquiler cuesta… или Este móvil cuesta…")]);
  if (source.includes("aprovechar") && /ocasi[oó]n/.test(source)) return pack(
    "У тебя 20 минут до поезда. Пролистать ленту или поймать шанс?",
    draft.tone === "humor" ? "Телефон: «ещё одно видео». Жизнь: «у тебя вообще-то есть шанс» 😼" : "Испанское aprovechar — про тот момент, когда время или возможность работают на тебя.",
    "Ты ждёшь поезд, а рядом оказался человек, с которым давно хотелось поговорить.\nAproveché la ocasión para hablar con ella.\nЯ воспользовалась случаем, чтобы поговорить с ней.",
    "Это не длинный список значений: время можно потратить, а можно использовать с пользой. Если подвернулся удобный момент — aprovecha. Случайная встреча превращается в маленькую возможность, которую ты не упускаешь.",
    visual("clock", "лёгкая паника от уходящего времени, затем радость найденного шанса", "Зацикленный мем: кот залипает в телефон, замечает таймер и оживляется, когда видит возможность поговорить. Не буквальная иллюстрация глагола.", "Ещё одно видео / А можно поймать шанс", "cat phone missed opportunity timer reaction"),
    [{ phrase: "Aprovecha el tiempo", meaning: "Используй время с пользой", note: "Например, пока ждёшь поезд." }, { phrase: "Aproveché la ocasión", meaning: "Я воспользовалась / воспользовался случаем", note: "Для действия добавь para: para hablar con ella." }],
    [choice("quiz", "До поезда 20 минут. Друг предлагает не терять их зря. Что он может сказать?", ["Aprovecha el tiempo.", "El tiempo es un ojo.", "La ocasión está sin blanca."], 0, "Aprovecha el tiempo — используй это время с пользой."),
     choice("trap", "Какая подпись под случайной встречей подменяет смысл фразы?", ["Aproveché la ocasión — воспользовалась случаем.", "Aproveché la ocasión — упустила возможность."], 1, "В aprovechar есть идея воспользоваться, а не упустить."),
     fill("⏰ + 💡: Aprovecha el ____. Какое слово превращает ожидание в полезные 20 минут?", ["tiempo"], "Aprovecha el tiempo — используй время с пользой.", "Речь о времени, не о человеке."),
     choice("reaction", "Подруга: «Как ты решилась с ней заговорить?» Вы случайно встретились. Твой ответ:", ["Aproveché la ocasión para hablar con ella.", "Perdí la ocasión para hablar con ella."], 0, "Ты использовала подходящий момент: aproveché la ocasión."),
     open("Какой маленькой возможностью ты воспользуешься сегодня? Напиши одну короткую фразу.", "Начни с Aprovecho… или Aproveché la ocasión para…")]);
  if (/saber/.test(source) && /saberse/.test(source)) return pack(
    "Знаешь песню — или уже поёшь за весь вагон?",
    draft.tone === "humor" ? "Ты: «я просто знаю эту песню». Ты через 3 секунды: солист, хор и бэк-вокал 🎤" : "Знать, как что-то делать, и помнить весь текст наизусть — разные ситуации. Почувствуем разницу на двух фразах.",
    "Друг предлагает зимнюю поездку: Sé esquiar — я умею кататься на лыжах.\nА стих можешь рассказать без подсказки: Me sé este poema — я знаю этот стих наизусть.",
    "Представь две сцены: ты уверенно встаёшь на лыжи и ты без запинки рассказываешь стих. В первой речь об умении, во второй — о том, что текст уже целиком в голове. Me sé подчёркивает это освоенное знание. Сказать Sé este poema de memoria тоже можно: это не запрет на обычный saber.",
    visual("memory", "самоуверенность, когда обещал знать только начало, а помнишь всё", "Зацикленный мем: кот скромно говорит «я только слышал», затем выдаёт весь текст как на концерте. Мем про узнавание себя, а не схема спряжения.", "Я только слышал / Я знаю весь текст", "cat singing knows lyrics by heart reaction"),
    [{ phrase: "Sé esquiar", meaning: "Я умею кататься на лыжах", note: "Saber + инфинитив: умение." }, { phrase: "Me sé este poema", meaning: "Я знаю этот стих наизусть", note: "Акцент на том, что текст хорошо запомнен." }],
    [choice("quiz", "На вечеринке просят рассказать стих без телефона. Ты его помнишь целиком. Как подчеркнуть это?", ["Me sé este poema.", "Sé esquiar.", "No sé bailar."], 0, "Me sé este poema подчёркивает, что стих уже у тебя в голове."),
     choice("trap", "Что из этого — ловушка в объяснении?", ["Sé esquiar — про умение.", "Me sé este poema — про хорошо запомненный текст.", "Сказать Sé este poema de memoria нельзя."], 2, "Sé… de memoria допустимо. Не превращаем полезную разницу в выдуманный запрет."),
     fill("🎿 + ✅: ____ esquiar. Как сказать «я умею кататься на лыжах»?", ["sé"], "Sé с ударением — форма saber: я знаю / умею.", "Две буквы; ударение на é важно."),
     choice("reaction", "— ¿Necesitas leer el poema? Ты можешь рассказать его без подсказки. Что ответишь?", ["No, me sé este poema.", "Sí, no conozco ninguna palabra."], 0, "No, me sé este poema — нет, я знаю этот стих наизусть."),
     open("Что ты умеешь, а какой текст помнишь наизусть? Напиши одну реплику с одной из двух конструкций.", "Sé + действие; Me sé + песня, стих или реплика. Например: Sé bailar.")]);
  const quoted = draft.sourceText.match(/[«“"]([^»”"]{3,180})[»”"]/u)?.[1];
  const phrase = quoted || draft.topic || draft.sourceText.split(/[\n.!?]/u).find(s => s.trim().length > 2)?.trim().slice(0, 160) || "Фраза из заметки";
  const word = phrase.split(/\s+/).find(w => /[a-záéíóúñ]/i.test(w)) || phrase;
  const excerpt = draft.sourceText.slice(0, 900);
  return pack(draft.topic || "Когда нужная фраза вспоминается на секунду позже",
    draft.tone === "humor" ? "Мозг после разговора: «а ведь можно было сказать вот так» 😼" : "Узнаёшь момент, когда нужные слова приходят уже после разговора? Попробуем вытащить одну фразу из заметки в живую речь.",
    phrase, `Материал преподавателя: ${excerpt}`, visual("reaction", "узнавание и облегчение, когда наконец нашлись слова", "Зацикленная реакция кота: растерянность сменяется уверенной репликой. Добавьте свой GIF, который передаёт это чувство.", "Мозг во время разговора / Мозг после разговора", "cat confused then confident reaction"),
    [{ phrase, meaning: "Фраза из вашей заметки", note: "Тестовый вариант: проверьте перевод и контекст в редакторе. Для новой темы подключите AI." }],
    [choice("quiz", "Какую фразу из заметки попробуешь сказать в следующем разговоре?", [phrase, phrase === "Этой фразы в примере не было" ? "Другая фраза" : "Этой фразы в примере не было"], 0, "Сравните с примером преподавателя."),
     choice("trap", "Что будет ловушкой при переносе этой фразы в реальный разговор?", ["Подобрать ситуацию, похожую на пример автора.", "Использовать её в любом контексте, не проверяя смысл."], 1, "Одна фраза не подходит автоматически ко всем ситуациям."),
     fill(`Вспомни первое испанское слово в примере «${phrase}».`, [word], `В примере: ${word}.`, "Посмотри на начало фразы."),
     choice("reaction", "Фраза вылетела из головы в разговоре. Как быстро её вернуть?", ["Вспомнить ситуацию из заметки и сказать пример вслух.", "Добавить случайные слова, чтобы звучало длиннее."], 0, "Связь с ситуацией помогает вернуть фразу. Затем проверь её у преподавателя."),
     open("Придумай свою короткую реплику с фразой из заметки.", "Выбери конкретного собеседника и ситуацию; не копируй весь исходный пост.")]);
}
