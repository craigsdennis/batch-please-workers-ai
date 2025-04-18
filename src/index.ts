import { Hono } from 'hono';
import { env } from 'cloudflare:workers';

const app = new Hono<{ Bindings: Env }>();

app.get('/example/single', async (c) => {
	// Uses the AI binding to run a single request
	const response = await env.AI.run('@cf/meta/llama-3.3-70b-instruct-fp8-fast', {
		prompt: "What's that song that goes 'all the single ladies'?",
	});
	return c.json({ response });
});

app.post('/example/batch', async (c) => {
	// This payload contains an array called `queries`
	const payload = await c.req.json();

	// Map to the required format
	const requests = payload.queries.map((q: string) => {
		return {
			text: q,
			target_lang: 'es',
		};
	});
	const response = await env.AI.run(
		'@cf/meta/m2m100-1.2b',
		{
			requests,
		},
		{ queueRequest: true }
	);
	return c.json({ response, model: '@cf/meta/m2m100-1.2b' });
});

app.post('/example/batch/with-reference', async (c) => {
	const payload = await c.req.json();
	// This uses an external reference
	// Oftentimes your request will have an external_reference/identifier
	// that you will want to sync up with the results.

	const requests = payload.users.map((user) => {
		return {
			text: user.profileStatus,
			source_lang: 'en',
			target_lang: 'es',
			external_reference: user.username,
		};
	});
	const response = await env.AI.run(
		'@cf/meta/m2m100-1.2b',
		{
			requests,
		},
		{ queueRequest: true }
	);
	return c.json({ response, model: '@cf/meta/m2m100-1.2b' });
});

app.post('/example/batch/extract', async (c) => {
	const payload = await c.req.json();
	// This uses an external reference
	// Oftentimes your request will have an external_reference/identifier
	// that you will want to sync up with the results.

	const requests = payload.users.map((user) => {
		return {
			prompt: `Extract the company names that are present in the following profile status: ${user.profileStatus}`,
			external_reference: user.username,
			response_format: {
				type: 'json_schema',
				json_schema: {
					type: 'object',
					properties: {
						companies: {
							type: 'array',
							items: {
								type: 'string',
								description: 'The name of the company',
							},
						},
					},
					required: ['companies'],
				},
			},
		};
	});
	console.log({ requests });
	const response = await env.AI.run(
		'@cf/meta/llama-3.3-70b-instruct-fp8-fast',
		{
			requests,
		},
		{ queueRequest: true }
	);
	return c.json({ response, model: '@cf/meta/llama-3.3-70b-instruct-fp8-fast'});
});

app.get('/sus', async (c) => {
	const inputs = [
		{
			username: 'johnsmith',
			profileStatus: 'Currently focusing on Cloud Architecture at AWS, previously at Microsoft and Google',
		},
		{
			username: 'janebrown',
			profileStatus: 'Leading AI projects at NVIDIA, former employee of Facebook and IBM',
		},
		{
			username: 'davidlee',
			profileStatus: 'Developing IoT solutions at Cisco, previously worked at Intel and Samsung',
		},
		{
			username: 'emilychen',
			profileStatus: 'Cybersecurity expert at Palo Alto Networks, former employee of Symantec and McAfee',
		},
		{
			username: 'michaelkim',
			profileStatus: 'Working on Data Science projects at LinkedIn, previously at Twitter and Airbnb',
		},
		{
			username: 'sarahpatel',
			profileStatus: 'Focusing on Blockchain development at Ethereum, former employee of Deloitte and Accenture',
		},
		{
			username: 'kevinwhite',
			profileStatus: 'Leading DevOps teams at Red Hat, previously worked at Amazon and Rackspace',
		},
		{
			username: 'oliviataylor',
			profileStatus: 'Currently working on AR/VR projects at Magic Leap, former employee of Apple and Oculus',
		},
		{
			username: 'williamdavis',
			profileStatus: 'Developing Machine Learning models at Google, previously worked at Microsoft and Baidu',
		},
		{
			username: 'amandawilson',
			profileStatus: 'Focusing on Networking solutions at Juniper Networks, former employee of Cisco and HP',
		},
	];
	const outputs = [
		{
			id: 0,
			result: {
				response: {
					companies: ['AWS', 'Microsoft', 'Google'],
				},
				tool_calls: [{}],
			},
			success: true,
			external_reference: 'johnsmith',
		},
		{
			id: 4,
			result: {
				response: {
					companies: ['LinkedIn', 'Twitter', 'Airbnb'],
				},
				tool_calls: [{}],
			},
			success: true,
			external_reference: 'michaelkim',
		},
		{
			id: 3,
			result: {
				response: {
					companies: [],
				},
				tool_calls: [{}],
			},
			success: true,
			external_reference: 'emilychen',
		},
		{
			id: 1,
			result: {
				response: {
					companies: ['NVIDIA', 'Facebook', 'IBM'],
				},
				tool_calls: [{}],
			},
			success: true,
			external_reference: 'janebrown',
		},
		{
			id: 2,
			result: {
				response: {
					companies: ['Cisco', 'Intel', 'Samsung'],
				},
				tool_calls: [{}],
			},
			success: true,
			external_reference: 'davidlee',
		},
		{
			id: 6,
			result: {
				response: {
					companies: [],
				},
				tool_calls: [{}],
			},
			success: true,
			external_reference: 'kevinwhite',
		},
		{
			id: 5,
			result: {
				response: {
					companies: [],
				},
				tool_calls: [{}],
			},
			success: true,
			external_reference: 'sarahpatel',
		},
		{
			id: 7,
			result: {
				response: {
					companies: [],
				},
				tool_calls: [{}],
			},
			success: true,
			external_reference: 'oliviataylor',
		},
		{
			id: 8,
			result: {
				response: {
					companies: [],
				},
				tool_calls: [{}],
			},
			success: true,
			external_reference: 'williamdavis',
		},
		{
			id: 9,
			result: {
				response: {
					companies: ['Juniper Networks', 'Cisco', 'HP'],
				},
				tool_calls: [{}],
			},
			success: true,
			external_reference: 'amandawilson',
		},
	];
	const empties = outputs.filter((o) => o.result.response.companies.length === 0);
	const users: { username: string; profileStatus: string }[] = [];
	for (const empty of empties) {
		const user = inputs.find((i) => i.username === empty.external_reference);
		if (user) {
			users.push(user);
		}
	}
	console.log("checking users", users);
	const results = [];
	for (const user of users) {
		const result = await c.env.AI.run('@cf/meta/llama-3.3-70b-instruct-fp8-fast', {
			prompt: `Extract the company names that are present in the following profile status: ${user.profileStatus}`,
			response_format: {
				type: 'json_schema',
				json_schema: {
					type: 'object',
					properties: {
						companies: {
							type: 'array',
							items: {
								type: 'string',
								description: 'The name of the company',
							},
						},
					},
					required: ['companies'],
				},
			},
		});
		if (result.response.companies.length > 0) {
			console.log('sus');
			console.log({ user, companies: result.response.companies });
			results.push(result);
		}
	}
	return c.json({results});
});

// Helper method to generate examples
app.get('/generate/sentences', async (c) => {
	const results = await env.AI.run('@cf/meta/llama-3.3-70b-instruct-fp8-fast', {
		prompt: 'Generate 10 common phrases that someone might ask to be translated',
		response_format: {
			type: 'json_schema',
			json_schema: {
				type: 'object',
				properties: {
					sentences: {
						type: 'array',
						items: {
							type: 'string',
							description: 'A common sentence that someone might ask for a translation',
						},
					},
				},
				required: ['sentences'],
			},
		},
	});
	return c.json(results);
});

// Helper method to generate examples
app.get('/generate/users', async (c) => {
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

app.get('/check-request', async (c) => {
	const id = c.req.query('id');
	const model = c.req.query('model');
	console.log({ id });
	// Use this pattern to poll for your async response status
	const response = await env.AI.run(model, {
		request_id: id,
	});
	return c.json(response);
});

export default app;
