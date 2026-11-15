// Demonstration copy for the reading-surface fixtures. No figure here is a live measurement.
export const LANGS = ['en', 'fr', 'es'] as const;
export type Lang = (typeof LANGS)[number];

export const SURFACE_COPY: Record<
	Lang,
	{ label: string; value: string; section: string; summary: string; field: string; hint: string }
> = {
	en: {
		label: 'Observation period',
		value: 'November 4 to 10, 2026',
		section: 'How the observation period and its sources were chosen',
		summary: 'The finding covers measured passages only; missing observations limit it.',
		field: 'Email address',
		hint: 'We only use it to reply to this message.',
	},
	fr: {
		label: 'Période d’observation complète',
		value: 'Du 4 au 10 novembre 2026',
		section: 'Comment la période d’observation et ses sources de données ont été choisies',
		summary: 'Le constat ne couvre que les passages mesurés; les observations manquantes en limitent la portée.',
		field: 'Adresse courriel',
		hint: 'Nous l’utilisons uniquement pour répondre à ce message.',
	},
	es: {
		label: 'Período de observación completo',
		value: 'Del 4 al 10 de noviembre de 2026',
		section: 'Cómo se eligieron el período de observación y sus fuentes de datos',
		summary: 'El hallazgo solo cubre los pasos medidos; las observaciones que faltan limitan su alcance.',
		field: 'Correo electrónico',
		hint: 'Solo lo usamos para responder a este mensaje.',
	},
};

/** Section ids come from language-independent keys, so #contact is the same section in every language. */
export const FRAME_SECTION_KEYS = ['scope', 'data', 'retention', 'contact'] as const;
type FrameKey = (typeof FRAME_SECTION_KEYS)[number];

export const FRAME_COPY: Record<
	Lang,
	{
		title: string;
		updatedLabel: string;
		updatedText: string;
		summary: string;
		contents: string;
		sections: Record<FrameKey, { title: string; body: string }>;
	}
> = {
	en: {
		title: 'Privacy policy',
		updatedLabel: 'Last updated',
		updatedText: 'November 2, 2026',
		summary:
			'This policy explains what the contact form collects, why it is kept, for how long, and how to ask for a copy or a deletion. It is a demonstration fixture, not a published policy.',
		contents: 'Contents',
		sections: {
			scope: {
				title: 'What this policy covers',
				body: 'It covers the messages you send through the contact form and the technical records the server keeps to deliver them safely. It does not cover sites that this page links to, which have their own policies and their own ways to reach the people who run them.',
			},
			data: {
				title: 'Data we keep',
				body: 'We keep your name, your email address and the message itself, together with the date it arrived. We do not add tracking identifiers, we do not build a profile, and we never sell or rent the information to anyone for any purpose.',
			},
			retention: {
				title: 'How long we keep it',
				body: 'A message stays for twelve months after the last reply so that the conversation can continue, then it is deleted. Server logs that record delivery problems are kept for thirty days and then removed automatically.',
			},
			contact: {
				title: 'Contact and requests',
				body: 'To ask for a copy of what we hold, a correction or a deletion, write to the address on the contact page. We answer within thirty days and tell you what we did, or why we could not do it.',
			},
		},
	},
	fr: {
		title: 'Politique de confidentialité',
		updatedLabel: 'Dernière mise à jour',
		updatedText: '2 novembre 2026',
		summary:
			'Cette politique explique ce que le formulaire de contact recueille, pourquoi ces renseignements sont conservés, pendant combien de temps, et comment en demander une copie ou la suppression. Il s’agit d’un exemple de démonstration, et non d’une politique publiée.',
		contents: 'Table des matières',
		sections: {
			scope: {
				title: 'Portée de la présente politique',
				body: 'Elle s’applique aux messages que vous envoyez au moyen du formulaire de contact et aux registres techniques que le serveur conserve pour les acheminer de façon sécuritaire. Elle ne s’applique pas aux sites vers lesquels cette page renvoie, qui ont leurs propres politiques.',
			},
			data: {
				title: 'Renseignements conservés',
				body: 'Nous conservons votre nom, votre adresse courriel et le message lui-même, ainsi que sa date de réception. Nous n’ajoutons aucun identifiant de suivi, nous ne constituons aucun profil et nous ne vendons ni ne louons jamais ces renseignements.',
			},
			retention: {
				title: 'Durée de conservation',
				body: 'Un message est conservé douze mois après la dernière réponse pour que la conversation puisse se poursuivre, puis il est supprimé. Les journaux du serveur qui consignent les problèmes d’acheminement sont conservés trente jours, puis supprimés automatiquement.',
			},
			contact: {
				title: 'Coordonnées et demandes d’accès',
				body: 'Pour demander une copie de vos renseignements, une correction ou une suppression, écrivez à l’adresse indiquée sur la page de contact. Nous répondons dans un délai de trente jours et vous indiquons ce que nous avons fait, ou pourquoi nous n’avons pas pu le faire.',
			},
		},
	},
	es: {
		title: 'Política de privacidad',
		updatedLabel: 'Última actualización',
		updatedText: '2 de noviembre de 2026',
		summary:
			'Esta política explica qué recoge el formulario de contacto, por qué se conserva, durante cuánto tiempo y cómo pedir una copia o su eliminación. Es un ejemplo de demostración, no una política publicada.',
		contents: 'Contenido',
		sections: {
			scope: {
				title: 'Alcance de esta política',
				body: 'Se aplica a los mensajes que envías mediante el formulario de contacto y a los registros técnicos que el servidor conserva para entregarlos de forma segura. No se aplica a los sitios a los que enlaza esta página, que tienen sus propias políticas.',
			},
			data: {
				title: 'Datos que conservamos',
				body: 'Conservamos tu nombre, tu dirección de correo electrónico y el mensaje, junto con la fecha en que llegó. No añadimos identificadores de seguimiento, no creamos perfiles y nunca vendemos ni alquilamos esta información a nadie.',
			},
			retention: {
				title: 'Cuánto tiempo los conservamos',
				body: 'Un mensaje se conserva doce meses después de la última respuesta para que la conversación pueda continuar y luego se elimina. Los registros del servidor sobre problemas de entrega se conservan treinta días y luego se eliminan automáticamente.',
			},
			contact: {
				title: 'Contacto y solicitudes de acceso',
				body: 'Para pedir una copia de lo que conservamos, una corrección o una eliminación, escribe a la dirección que figura en la página de contacto. Respondemos en un plazo de treinta días y te decimos qué hicimos o por qué no pudimos hacerlo.',
			},
		},
	},
};
