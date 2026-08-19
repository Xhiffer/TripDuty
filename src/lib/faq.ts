/** Les questions frequentes, en francais et en anglais. */
export interface FaqItem {
  q: { fr: string; en: string }
  a: { fr: string; en: string }
}

export const FAQ: FaqItem[] = [
  {
    q: { fr: 'À quoi sert Trip Duty ?', en: 'What is Trip Duty for?' },
    a: {
      fr: 'À répartir les tâches d’un séjour entre amis sans que personne ne compte dans sa tête. Chaque tâche vaut des points, et l’application tient le compte de qui a donné et de qui a reçu.',
      en: 'To share out the chores of a trip without anyone keeping score in their head. Every task is worth points, and the app tracks who gave and who received.',
    },
  },
  {
    q: { fr: 'Pourquoi mon solde ne bouge pas quand je cuisine pour moi seul ?', en: 'Why does my balance not move when I cook just for myself?' },
    a: {
      fr: 'Parce que tu es à la fois celui qui fait et celui pour qui c’est fait. Tu gagnes les points et tu les dois : ça s’annule, et personne d’autre n’est touché.',
      en: 'Because you are both the one doing it and the one it is for. You earn the points and you owe them: it cancels out, and nobody else is affected.',
    },
  },
  {
    q: { fr: 'Que veut dire « pour qui » au moment de valider ?', en: 'What does "who is it for" mean when validating?' },
    a: {
      fr: 'C’est la liste des personnes qui profitent de la tâche. Un petit-déjeuner préparé pour quatre ne concerne que ces quatre-là : les cinq autres ne doivent rien.',
      en: 'It is the list of people the task benefits. A breakfast made for four only concerns those four: the others owe nothing.',
    },
  },
  {
    q: { fr: 'Pourquoi la somme des soldes fait toujours zéro ?', en: 'Why do all balances always add up to zero?' },
    a: {
      fr: 'Parce que les points ne sortent de nulle part : ce que gagne celui qui fait la tâche est exactement ce que doivent ceux pour qui elle est faite. C’est le principe d’un compte partagé.',
      en: 'Because points come from nowhere else: what the doer earns is exactly what the beneficiaries owe. That is how a shared account works.',
    },
  },
  {
    q: { fr: 'L’application m’oblige-t-elle à faire une tâche ?', en: 'Does the app force me to do a task?' },
    a: {
      fr: 'Jamais. Elle affiche les soldes et suggère en gris qui aurait intérêt à s’y coller. N’importe qui peut prendre la tâche, et celui qui est suggéré n’est prévenu de rien.',
      en: 'Never. It shows balances and suggests in grey who would gain most from stepping up. Anyone can take the task, and the suggested person is not notified.',
    },
  },
  {
    q: { fr: 'Comment sont choisies les suggestions ?', en: 'How are suggestions chosen?' },
    a: {
      fr: 'L’application simule le résultat pour chaque personne et garde celles qui rapprochent le plus le groupe de l’équilibre. Une même personne n’arrive pas en tête de toutes les tâches de la journée.',
      en: 'The app simulates the outcome for each person and keeps those who bring the group closest to even. The same person never tops every task of the day.',
    },
  },
  {
    q: { fr: 'Que se passe-t-il si je ne fais pas une tâche que j’ai prise ?', en: 'What if I do not do a task I took on?' },
    a: {
      fr: 'Un chef peut la marquer non faite. Les points du malus te sont retirés et vont à ceux que tu as laissés tomber. Une tâche que personne n’avait prise ne donne aucun malus.',
      en: 'A chef can mark it as not done. The penalty is taken from you and goes to the people you let down. A task nobody had taken carries no penalty.',
    },
  },
  {
    q: { fr: 'Qui peut annuler une validation ?', en: 'Who can undo a validation?' },
    a: {
      fr: 'Un chef du groupe. Il rouvre la tâche et les points repartent, ce qui règle le cas de quelqu’un qui aurait validé une tâche qu’il n’a pas faite.',
      en: 'A chef of the group. They reopen the task and the points go back, which settles the case of someone validating a task they did not do.',
    },
  },
  {
    q: { fr: 'C’est quoi un chef ?', en: 'What is a chef?' },
    a: {
      fr: 'Quelqu’un qui peut modifier le séjour, annuler une validation et lancer le bilan. L’hôte est celui qui a créé le groupe, et lui seul nomme les chefs.',
      en: 'Someone who can edit the trip, undo a validation and start the wrap-up. The host created the group, and only they appoint chefs.',
    },
  },
  {
    q: { fr: 'À quoi sert le bilan de fin ?', en: 'What is the wrap-up for?' },
    a: {
      fr: 'Le dernier jour, les grosses tâches de clôture reviennent à ceux qui doivent encore au groupe : la tournée, le grand ménage, le plein du retour. Tout le monde repart à zéro.',
      en: 'On the last day, the big closing tasks go to those who still owe the group: the round of drinks, the big clean, the tank for the way back. Everyone leaves even.',
    },
  },
  {
    q: { fr: 'Comment inviter quelqu’un ?', en: 'How do I invite someone?' },
    a: {
      fr: 'Depuis les trois points en haut du groupe, « Partager le groupe ». Envoie le lien, ou dicte le code à six caractères que l’autre saisit depuis sa liste de groupes.',
      en: 'From the three dots at the top of the group, "Share the group". Send the link, or read out the six-character code to be entered from their group list.',
    },
  },
  {
    q: { fr: 'Puis-je être dans plusieurs groupes ?', en: 'Can I be in several groups?' },
    a: {
      fr: 'Oui, autant que tu veux, et les soldes sont comptés séparément pour chacun. Un séjour aux Gorges du Verdon et une coloc ne se mélangent pas.',
      en: 'Yes, as many as you like, and balances are counted separately for each. A trip and a flatshare never mix.',
    },
  },
  {
    q: { fr: 'Puis-je quitter un groupe ?', en: 'Can I leave a group?' },
    a: {
      fr: 'Oui, depuis les trois points. Si tu es l’hôte, il faut d’abord désigner qui reprend le groupe. Si tu es la dernière personne, le groupe disparaît.',
      en: 'Yes, from the three dots. If you are the host, you first pick who takes over. If you are the last person, the group disappears.',
    },
  },
  {
    q: { fr: 'Mon mot de passe peut-il m’être renvoyé ?', en: 'Can my password be sent back to me?' },
    a: {
      fr: 'Non, et c’est voulu. La base n’en garde qu’une empreinte impossible à inverser : personne ne peut le relire. « Mot de passe oublié » envoie un lien pour en choisir un nouveau.',
      en: 'No, and that is deliberate. The database only keeps a fingerprint that cannot be reversed: nobody can read it back. "Forgot your password" sends a link to choose a new one.',
    },
  },
  {
    q: { fr: 'Que devient mon compte si je le supprime ?', en: 'What happens to my account if I delete it?' },
    a: {
      fr: 'Tu sors de tous tes groupes d’un coup et tu n’apparais plus dans leurs classements. Les tâches déjà validées restent au crédit du groupe, sinon les soldes des autres seraient faussés.',
      en: 'You leave all your groups at once and no longer appear in their rankings. Tasks already validated stay on the group ledger, otherwise everyone else’s balance would be wrong.',
    },
  },
  {
    q: { fr: 'Comment mettre l’application sur mon écran d’accueil ?', en: 'How do I add the app to my home screen?' },
    a: {
      fr: 'Le bouton se trouve sous « Créer un groupe ». Sur iPhone, il faut passer par le bouton Partager de Safari puis « Sur l’écran d’accueil ».',
      en: 'The button sits under "Create a group". On iPhone, use the Share button in Safari then "Add to Home Screen".',
    },
  },
]
