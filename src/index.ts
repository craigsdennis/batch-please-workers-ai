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
			target_lang: "es"
		};
	});
	const response = await env.AI.run(
		'@cf/meta/m2m100-1.2b',
		{
			requests,
		},
		{ queueRequest: true }
	);
	return c.json({ response });
});

app.post('/example/batch/with-reference', async (c) => {
	const payload = await c.req.json();
	// This uses an external reference
	// Oftentimes your request will have an external_reference/identifier
	// that you will want to sync up with the results.

	const requests = payload.users.map((user) => {
		return {
			text: user.profileStatus,
			source_lang: "en",
			target_lang: "es",
			external_reference: user.username,
		}
	});
	const response = await env.AI.run(
		'@cf/meta/m2m100-1.2b',
		{
			requests,
		},
		{ queueRequest: true }
	);
	return c.json({ response });
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
