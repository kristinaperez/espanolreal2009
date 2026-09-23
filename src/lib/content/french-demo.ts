import type { Distractor, Lesson } from "./types";

const lessons: Record<number, Lesson> = {
  1: {
    lesson: 1, slug: "me-cuentas", title: "Me cuentas", subtitle: "Les premières phrases d'une conversation naturelle", category: "daily-life", milestone: "first-days", difficulty: "A1", tags: ["vie quotidienne", "pronoms", "conversation"],
    summary: "Les phrases qui ouvrent une conversation en Espagne. Les Espagnols disent rarement «cuéntame» : ils disent plutôt «me cuentas».",
    situation: "Première conversation avec un voisin, un collègue ou un serveur",
    authorComment: "Ne traduisez pas ces phrases mot à mot. «Me cuentas» n'est pas un ordre : c'est une invitation à parler. C'est ainsi qu'on commence une conversation en Espagne.",
    phrases: [
      { spanish: "Me cuentas", translation: "Tu me raconteras", example: "Lo haces y me cuentas.", exampleTranslation: "Tu le fais et tu me racontes.", notes: "À l'oral, le pronom «me» se place souvent avant le verbe : me cuentas, te llamo, se lo digo.", difficulty: "A1" },
      { spanish: "¿Qué me cuentas?", translation: "Quoi de neuf ? / Comment ça va ?", example: "¡Hombre! ¿Qué me cuentas?", exampleTranslation: "Salut ! Quoi de neuf ?", notes: "Une salutation typique entre connaissances. On peut répondre : «Nada, aquí estamos».", difficulty: "A1" },
      { spanish: "Ya te cuento", translation: "Je te raconte tout de suite / je te raconterai", example: "Espera, ya te cuento.", exampleTranslation: "Attends, je te raconte tout de suite.", notes: "Ici, «ya» adoucit la phrase : il signifie plutôt «tout de suite» que «déjà».", difficulty: "A1" },
      { spanish: "Cuéntamelo todo", translation: "Raconte-moi tout", example: "Ven aquí y cuéntamelo todo.", exampleTranslation: "Viens ici et raconte-moi tout.", notes: "Deux pronoms se combinent : me + lo = melo.", difficulty: "A2" },
      { spanish: "Ni idea", translation: "Aucune idée", example: "— ¿A qué hora cierra? — Ni idea.", exampleTranslation: "— À quelle heure ça ferme ? — Aucune idée.", notes: "Réponse très fréquente. Plus poli : «No lo sé».", difficulty: "A1" },
      { spanish: "Vamos a ver", translation: "Voyons voir / alors", example: "Vamos a ver qué dicen.", exampleTranslation: "Voyons ce qu'ils disent.", notes: "Une expression très polyvalente quand on a besoin de réfléchir.", difficulty: "A1" },
      { spanish: "Ya verás", translation: "Tu verras", example: "Ya verás, te gusta.", exampleTranslation: "Tu verras, ça va te plaire.", notes: "Elle exprime la certitude de la personne qui parle. Une tournure très courante entre amis.", difficulty: "A2" },
      { spanish: "No pasa nada", translation: "Ce n'est rien / pas de souci", example: "Perdona por el retraso. — No pasa nada.", exampleTranslation: "Pardon pour le retard. — Ce n'est rien.", notes: "La phrase-médicament : on l'entend des dizaines de fois par jour en Espagne.", difficulty: "A1" },
    ],
  },
  2: {
    lesson: 2, slug: "que-tal", title: "¿Qué tal?", subtitle: "Salutations et premier contact", category: "daily-life", milestone: "first-days", difficulty: "A1", tags: ["salutations", "vie quotidienne", "petite conversation"],
    summary: "Comment saluer, demander comment ça va et terminer poliment une conversation — comme on le fait en Espagne.",
    situation: "Le matin dans un bar ou une rencontre avec un voisin dans la rue",
    authorComment: "En Espagne, il est important de dire bonjour, même si vous n'ajoutez rien. «Buenos días» ouvre toutes les portes.",
    phrases: [
      { spanish: "¿Qué tal?", translation: "Ça va ? / Comment ça va ?", example: "¿Qué tal? ¿Todo bien?", exampleTranslation: "Ça va ? Tout va bien ?", notes: "La réponse est souvent : «Bien, ¿y tú?».", difficulty: "A1" },
      { spanish: "¿Todo bien?", translation: "Tout va bien ? / Ça va ?", example: "¡Hola! ¿Todo bien por aquí?", exampleTranslation: "Salut ! Tout va bien par ici ?", notes: "Informel, entre voisins et connaissances.", difficulty: "A1" },
      { spanish: "Buenos días", translation: "Bonjour", example: "Buenos días, ¿está abierto?", exampleTranslation: "Bonjour, est-ce que c'est ouvert ?", notes: "S'emploie en général jusqu'à 14 h, puis on dit «buenas tardes».", difficulty: "A1" },
      { spanish: "Hasta luego", translation: "À plus tard / au revoir", example: "Gracias por todo. — Hasta luego.", exampleTranslation: "Merci pour tout. — À plus tard.", notes: "Une formule d'au revoir universelle, pour un magasin comme pour des amis.", difficulty: "A1" },
      { spanish: "Mucho gusto", translation: "Enchanté(e)", example: "Soy Pavel. — Mucho gusto.", exampleTranslation: "Je suis Pavel. — Enchanté(e).", notes: "Plus formel : «Encantado / Encantada».", difficulty: "A1" },
      { spanish: "¿Cómo te llamas?", translation: "Comment tu t'appelles ?", example: "Perdona, ¿cómo te llamas?", exampleTranslation: "Pardon, comment tu t'appelles ?", notes: "Pour vouvoyer une personne inconnue : «¿Cómo se llama usted?».", difficulty: "A1" },
      { spanish: "Un placer", translation: "Ravi(e) de vous rencontrer", example: "Un placer, hasta mañana.", exampleTranslation: "Ravi(e), à demain.", notes: "S'emploie au moment de se quitter après une première rencontre.", difficulty: "A2" },
      { spanish: "Nos vemos", translation: "On se voit / à bientôt", example: "Nos vemos por la tarde.", exampleTranslation: "On se voit dans l'après-midi.", notes: "Plus court et plus chaleureux que «adiós».", difficulty: "A1" },
    ],
  },
};

export function localizeLessonForFrench(lesson: Lesson): Lesson {
  return lessons[lesson.lesson] ?? lesson;
}

export function frenchDemoPool(currentLesson: number): Distractor[] {
  return Object.values(lessons)
    .filter((lesson) => lesson.lesson !== currentLesson)
    .flatMap((lesson) => lesson.phrases.map(({ spanish, translation }) => ({ spanish, translation })));
}
