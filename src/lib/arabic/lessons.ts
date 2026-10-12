import type { Lesson, Distractor } from "@/lib/content/types";

export type SituationLocale = "ru" | "fr" | "ar";
type Translation = Record<SituationLocale, string>;
export interface SituationPhrase { spanish: string; translations: Translation }
export interface SituationLesson {
  id: number; slug: string; category: string; title: Translation; outcome: Translation;
  vocabulary: SituationPhrase[]; phrases: SituationPhrase[];
  dialogue: { speaker: string; spanish: string; ar: string }[];
  blank: { sentence: string; answer: string; options: string[] };
  scenario: { ar: string; phraseIndex: number };
}
const phrase = (spanish: string, ar: string, ru: string, fr: string): SituationPhrase => ({ spanish, translations: { ar, ru, fr } });
export const situationLessons: SituationLesson[] = [
  {
    id: 1001, slug: "housing", category: "housing",
    title: { ar: "استئجار منزل في إسبانيا", ru: "Аренда жилья в Испании", fr: "Louer un logement en Espagne" },
    outcome: { ar: "يمكنك الآن السؤال عن الإيجار والضمان والمصاريف وتحديد موعد لزيارة المسكن.", ru: "Вы можете спросить об аренде, залоге, расходах и договориться о просмотре.", fr: "Vous pouvez demander le loyer, la caution, les charges et organiser une visite." },
    vocabulary: [phrase("piso", "شقة", "квартира", "appartement"), phrase("habitación", "غرفة", "комната", "chambre"), phrase("alquiler", "إيجار", "аренда", "loyer"), phrase("fianza", "مبلغ الضمان", "залог", "caution"), phrase("gastos", "مصاريف", "расходы", "charges"), phrase("contrato", "عقد", "договор", "contrat")],
    phrases: [
      phrase("Busco una habitación.", "أبحث عن غرفة.", "Я ищу комнату.", "Je cherche une chambre."),
      phrase("Busco un piso.", "أبحث عن شقة.", "Я ищу квартиру.", "Je cherche un appartement."),
      phrase("¿Cuánto cuesta al mes?", "كم يكلف شهريًا؟", "Сколько стоит в месяц?", "Combien cela coûte par mois ?"),
      phrase("¿Los gastos están incluidos?", "هل المصاريف مشمولة؟", "Расходы включены?", "Les charges sont-elles comprises ?"),
      phrase("¿Cuánto es la fianza?", "كم يبلغ مبلغ الضمان؟", "Какой размер залога?", "Quel est le montant de la caution ?"),
      phrase("Quiero ver el piso.", "أريد زيارة الشقة.", "Я хочу посмотреть квартиру.", "Je voudrais visiter l'appartement."),
      phrase("¿Cuándo puedo entrar?", "متى يمكنني الانتقال للسكن؟", "Когда я могу въехать?", "Quand puis-je emménager ?"),
      phrase("¿Podemos firmar un contrato?", "هل يمكننا توقيع عقد؟", "Мы можем подписать договор?", "Pouvons-nous signer un contrat ?"),
    ],
    dialogue: [
      { speaker: "المتصل", spanish: "Hola, llamo por la habitación.", ar: "مرحبًا، أتصل بخصوص الغرفة." },
      { speaker: "صاحب المسكن", spanish: "Sí, todavía está disponible.", ar: "نعم، ما زالت متاحة." },
      { speaker: "المتصل", spanish: "¿Cuánto cuesta al mes?", ar: "كم تكلف شهريًا؟" },
      { speaker: "صاحب المسكن", spanish: "Son cuatrocientos euros, con los gastos incluidos.", ar: "أربعمئة يورو، والمصاريف مشمولة." },
      { speaker: "المتصل", spanish: "¿Cuánto es la fianza?", ar: "كم يبلغ مبلغ الضمان؟" },
      { speaker: "صاحب المسكن", spanish: "Cuatrocientos euros. Puedes verla mañana.", ar: "أربعمئة يورو. يمكنك زيارتها غدًا." },
    ],
    blank: { sentence: "¿Cuánto _____ al mes?", answer: "cuesta", options: ["cuesta", "tengo", "busco", "firma"] },
    scenario: { ar: "وجدت إعلانًا عن شقة. تريد زيارتها قبل أن تقرر. ماذا تقول؟", phraseIndex: 5 },
  },
  {
    id: 1002, slug: "doctor", category: "health",
    title: { ar: "عند الطبيب في إسبانيا", ru: "У врача в Испании", fr: "Chez le médecin en Espagne" },
    outcome: { ar: "يمكنك الآن وصف أعراض بسيطة وذكر مدتها وأدويتك وحساسياتك للطبيب.", ru: "Вы можете описать простые симптомы, их длительность, лекарства и аллергию.", fr: "Vous pouvez décrire des symptômes simples, leur durée, vos médicaments et allergies." },
    vocabulary: [phrase("dolor", "ألم", "боль", "douleur"), phrase("fiebre", "حمّى", "температура", "fièvre"), phrase("tos", "سعال", "кашель", "toux"), phrase("medicamento", "دواء", "лекарство", "médicament"), phrase("alergia", "حساسية", "аллергия", "allergie"), phrase("cita", "موعد", "запись на приём", "rendez-vous")],
    phrases: [
      phrase("Me duele aquí.", "أشعر بألم هنا.", "У меня болит здесь.", "J'ai mal ici."),
      phrase("Me duele la garganta.", "يؤلمني حلقي.", "У меня болит горло.", "J'ai mal à la gorge."),
      phrase("Tengo fiebre.", "لديّ حمّى.", "У меня температура.", "J'ai de la fièvre."),
      phrase("Tengo tos.", "لديّ سعال.", "У меня кашель.", "J'ai de la toux."),
      phrase("Necesito una cita.", "أحتاج إلى موعد.", "Мне нужна запись на приём.", "J'ai besoin d'un rendez-vous."),
      phrase("Desde ayer.", "منذ أمس.", "Со вчерашнего дня.", "Depuis hier."),
      phrase("Tomo este medicamento.", "أتناول هذا الدواء.", "Я принимаю это лекарство.", "Je prends ce médicament."),
      phrase("Soy alérgico a la penicilina.", "لديّ حساسية من البنسلين. (صيغة المذكر)", "У меня аллергия на пенициллин (мужская форма).", "Je suis allergique à la pénicilline (forme masculine)."),
      phrase("Soy alérgica a la penicilina.", "لديّ حساسية من البنسلين. (صيغة المؤنث)", "У меня аллергия на пенициллин (женская форма).", "Je suis allergique à la pénicilline (forme féminine)."),
    ],
    dialogue: [
      { speaker: "الطبيب", spanish: "¿Qué le pasa?", ar: "ما الذي تشكو منه؟" },
      { speaker: "المريض", spanish: "Me duele la garganta.", ar: "يؤلمني حلقي." },
      { speaker: "الطبيب", spanish: "¿Tiene fiebre?", ar: "هل لديك حمّى؟" },
      { speaker: "المريض", spanish: "Sí, desde ayer.", ar: "نعم، منذ أمس." },
      { speaker: "الطبيب", spanish: "¿Toma algún medicamento?", ar: "هل تتناول أي دواء؟" },
      { speaker: "المريض", spanish: "Tomo este medicamento.", ar: "أتناول هذا الدواء." },
    ],
    blank: { sentence: "Me _____ la garganta.", answer: "duele", options: ["duele", "tomo", "tengo", "soy"] },
    scenario: { ar: "يسألك الطبيب متى بدأت الأعراض. بدأت أمس. كيف تجيب؟", phraseIndex: 5 },
  },
  {
    id: 1003, slug: "work-documents", category: "work",
    title: { ar: "العمل والأوراق في إسبانيا", ru: "Работа и документы в Испании", fr: "Travail et documents en Espagne" },
    outcome: { ar: "يمكنك الآن تقديم نفسك للعمل والتحدث عن خبرتك والسؤال عن الوثائق والتوقيع.", ru: "Вы можете представиться работодателю, рассказать об опыте и спросить о документах.", fr: "Vous pouvez vous présenter à un employeur, parler de votre expérience et demander les documents." },
    vocabulary: [phrase("trabajo", "عمل", "работа", "travail"), phrase("experiencia", "خبرة", "опыт", "expérience"), phrase("horario", "ساعات العمل", "график", "horaires"), phrase("contrato", "عقد", "договор", "contrat"), phrase("documentos", "وثائق", "документы", "documents"), phrase("firma", "توقيع", "подпись", "signature")],
    phrases: [
      phrase("Estoy buscando trabajo.", "أبحث عن عمل.", "Я ищу работу.", "Je cherche du travail."),
      phrase("Tengo experiencia.", "لديّ خبرة.", "У меня есть опыт.", "J'ai de l'expérience."),
      phrase("Puedo empezar mañana.", "يمكنني البدء غدًا.", "Я могу начать завтра.", "Je peux commencer demain."),
      phrase("Tengo NIE.", "لديّ رقم تعريف الأجنبي (NIE).", "У меня есть NIE.", "J'ai un NIE."),
      phrase("Tengo permiso de trabajo.", "لديّ تصريح عمل.", "У меня есть разрешение на работу.", "J'ai une autorisation de travail."),
      phrase("¿Qué documentos necesita?", "ما الوثائق التي تحتاجها؟", "Какие документы вам нужны?", "De quels documents avez-vous besoin ?"),
      phrase("¿Dónde tengo que firmar?", "أين يجب أن أوقّع؟", "Где мне нужно подписать?", "Où dois-je signer ?"),
      phrase("¿Cuál es el horario?", "ما ساعات العمل؟", "Какой график работы?", "Quels sont les horaires ?"),
      phrase("¿El contrato es a jornada completa?", "هل العقد بدوام كامل؟", "Договор на полный рабочий день?", "Le contrat est-il à temps plein ?"),
    ],
    dialogue: [
      { speaker: "الباحث عن عمل", spanish: "Estoy buscando trabajo. Tengo experiencia.", ar: "أبحث عن عمل. لديّ خبرة." },
      { speaker: "صاحب العمل", spanish: "¿Cuándo puede empezar?", ar: "متى يمكنك البدء؟" },
      { speaker: "الباحث عن عمل", spanish: "Puedo empezar mañana.", ar: "يمكنني البدء غدًا." },
      { speaker: "صاحب العمل", spanish: "¿Tiene permiso de trabajo?", ar: "هل لديك تصريح عمل؟" },
      { speaker: "الباحث عن عمل", spanish: "Sí. ¿Qué documentos necesita?", ar: "نعم. ما الوثائق التي تحتاجها؟" },
      { speaker: "صاحب العمل", spanish: "Traiga su documentación mañana.", ar: "أحضر وثائقك غدًا." },
    ],
    blank: { sentence: "Estoy _____ trabajo.", answer: "buscando", options: ["buscando", "firmar", "tengo", "mañana"] },
    scenario: { ar: "وصلت إلى نهاية المقابلة ولم يوضح صاحب العمل ساعات الدوام. ماذا تسأل؟", phraseIndex: 7 },
  },
];
export function findSituation(slug: string) { return situationLessons.find(lesson => lesson.slug === slug); }
export function localizeSituation(source: SituationLesson, locale: SituationLocale): Lesson {
  return { lesson: source.id, slug: source.slug, title: source.title[locale], summary: source.outcome[locale], category: source.category, milestone: source.category, difficulty: "A0–A1", tags: [], phrases: source.phrases.map(p => ({ spanish: p.spanish, translation: p.translations[locale] })) };
}
export function situationPool(locale: SituationLocale): Distractor[] {
  return situationLessons.flatMap(lesson => lesson.phrases.map(p => ({ spanish: p.spanish, translation: p.translations[locale] })));
}
