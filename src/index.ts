import { Hono } from 'hono';
import { env } from 'cloudflare:workers';

const app = new Hono<{ Bindings: Env }>();

app.get('/single', async (c) => {
	const response = await env.AI.run('@cf/meta/llama-3.3-70b-instruct-fp8-fast', {
		prompt: "What's that song that goes 'all the single ladies'?",
	});
	return c.json({ response });
});

app.get('/batch-no-ref', async (c) => {
	const queries = [
		"What's the name of the song that goes 'be humble' in the chorus?",
		"What is the name of the band with the song that sings 'Tongue Tied'?",
		'What is the term for people who follow bands around?',
		'What are the best songs to put on a playlist',
		'What songs are a must have for a metal playlist',
		'What songs are a must have for a indie rock playlist',
		'What songs are a must have for a 80s playlist',
		'What songs are a must have for a 90s playlist',
		'What songs are a must have for a 2000s playlist',
	];
	const prompts = queries.map((q) => {
		return { prompt: q };
	});
	const response = await env.AI.run(
		'@cf/meta/llama-3.3-70b-instruct-batch',
		{
			prompts,
		},
		{ queueRequest: true }
	);
	return c.json({ response });
});

app.get('/batch-with-ref', async (c) => {
	// Generated from /sample-data
	const users = [
		{
			username: 'johndoe',
			profileStatus: 'Currently exploring AI solutions. Formerly at Microsoft, IBM',
		},
		{
			username: 'janedoe',
			profileStatus: 'Focusing on cloud computing. Previous experience at Amazon, Google',
		},
		{
			username: 'bobsmith',
			profileStatus: 'Developing expertise in cybersecurity. Ex-employee of Cisco, Oracle',
		},
		{
			username: 'alicejohnson',
			profileStatus: 'Delving into data analytics. Formerly at Facebook, Twitter',
		},
		{
			username: 'mikebrown',
			profileStatus: 'Specializing in network architecture. Previously at Dell, HP',
		},
		{
			username: 'emilydavis',
			profileStatus: 'Improving skills in software development. Ex-employee of Apple, Intel',
		},
		{
			username: 'sarahlee',
			profileStatus: 'Investigating IoT technologies. Former experience at Samsung, LG',
		},
		{
			username: 'kevinwhite',
			profileStatus: 'Enhancing knowledge in database management. Previously at Oracle, MySQL',
		},
		{
			username: 'oliviataylor',
			profileStatus: 'Exploring virtual reality applications. Formerly at NVIDIA, AMD',
		},
		{
			username: 'williammartin',
			profileStatus: 'Focusing on web development. Ex-employee of GitHub, Mozilla',
		},
	];
	const prompts = users.map(user => {
		return {
			prompt: `Translate the following to Spanish: ${user.profileStatus}`,
			external_reference: user.username
		}
	});
	const results = await env.AI.run(
		'@cf/meta/llama-3.3-70b-instruct-batch',
		{
			prompts,
		},
	);
	return c.json(results);
});

app.get('/sample-data', async (c) => {
	const results = await env.AI.run('@cf/meta/llama-3.3-70b-instruct-fp8-fast', {
		prompt: 'Generate 10 business users each with a profile status',
		response_format: {
			type: 'json_schema',
			json_schema: {
				type: 'object',
				properties: {
					users: {
						type: 'array',
						items: {
							type: 'object',
							properties: {
								username: {
									type: 'string',
									description: 'A username without spaces all lowercase',
								},
								profileStatus: {
									type: 'string',
									description:
										'Lightly describes what the user is currently are focussing on technology wise, and then lists previous employers. To be used in the profile header next to their photo.',
								},
							},
						},
					},
				},
				required: ['users'],
			},
		},
	});
	return c.json(results);
});

app.get('/batch-no-ref', async (c) => {
	const queries = [
		"What's the name of the song that goes 'be humble' in the chorus?",
		"What is the name of the band with the song that sings 'Tongue Tied'?",
		'What is the term for people who follow bands around?',
		'What are the best songs to put on a playlist',
		'What songs are a must have for a metal playlist',
		'What songs are a must have for a indie rock playlist',
		'What songs are a must have for a 80s playlist',
		'What songs are a must have for a 90s playlist',
		'What songs are a must have for a 2000s playlist',
	];
	const prompts = queries.map((q) => {
		return { prompt: q };
	});
	const response = await env.AI.run(
		'@cf/meta/llama-3.3-70b-instruct-batch',
		{
			prompts,
		},
		{ queueRequest: true }
	);
	return c.json({ response });
});

app.get('/check-request', async (c) => {
	const id = c.req.query('id');
	console.log({ id });
	const response = await env.AI.run('@cf/meta/llama-3.3-70b-instruct-batch', {
		request_id: id,
	});
	return c.json(response);
});

export default app;
