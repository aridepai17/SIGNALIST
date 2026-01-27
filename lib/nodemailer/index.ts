import nodemailer from "nodemailer";
import {
	WELCOME_EMAIL_TEMPLATE,
	NEWS_SUMMARY_EMAIL_TEMPLATE,
} from "@/lib/nodemailer/templates";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://signalist.app";
const UNSUBSCRIBE_URL = `${BASE_URL}/unsubscribe`;

export const transporter = nodemailer.createTransport({
	service: "gmail",
	auth: {
		user: process.env.NODEMAILER_EMAIL!,
		pass: process.env.NODEMAILER_PASSWORD!,
	},
});

export const sendWelcomeEmail = async ({
	email,
	name,
	intro,
}: WelcomeEmailData) => {
	const htmlTemplate = WELCOME_EMAIL_TEMPLATE.replace("{{name}}", name)
		.replace("{{intro}}", intro)
		.replaceAll("{{baseUrl}}", BASE_URL)
		.replaceAll("{{unsubscribeUrl}}", UNSUBSCRIBE_URL);

	const mailOptions = {
		from: `"Signalist" <signalist@aridepai17.pro>`,
		to: email,
		subject: `Welcome to Signalist - your stock toolkit is ready!`,
		text: "Thanks for joining Signalist",
		html: htmlTemplate,
	};

	await transporter.sendMail(mailOptions);
};

export const sendNewsSummaryEmail = async ({
	email,
	date,
	newsContent,
}: {
	email: string;
	date: string;
	newsContent: string;
}): Promise<void> => {
	const htmlTemplate = NEWS_SUMMARY_EMAIL_TEMPLATE.replace("{{date}}", date)
		.replace("{{newsContent}}", newsContent)
		.replaceAll("{{baseUrl}}", BASE_URL)
		.replaceAll("{{unsubscribeUrl}}", UNSUBSCRIBE_URL);

	const mailOptions = {
		from: `"Signalist News" <signalist@aridepai17.pro>`,
		to: email,
		subject: `Market News Summary Today - ${date}`,
		text: `Today's market news summary from Signalist`,
		html: htmlTemplate,
	};

	await transporter.sendMail(mailOptions);
};
