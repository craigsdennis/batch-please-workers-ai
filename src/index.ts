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
		return { prompt: q };
	});
	const response = await env.AI.run(
		'@cf/meta/ray-llama-3.3-70b-instruct-fp8-fast',
		{
			requests,
		},
		// If you choose to queue the request or try it synchronously
		{ queueRequest: payload.queueRequest || false }
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
			prompt: `Translate the following to Spanish: ${user.profileStatus}`,
			external_reference: user.username
		}
	});
	const response = await env.AI.run(
		'@cf/meta/ray-llama-3.3-70b-instruct-fp8-fast',
		{
			requests,
		},
		{ queueRequest: payload.queueRequest || false }
	);
	return c.json({response});
});

// Helper method to generate examples
app.get("/generate/prompts", async(c) => {
	const results = await env.AI.run('@cf/meta/llama-3.3-70b-instruct-fp8-fast', {
		prompt: 'Generate 10 prompts that someone might ask an LLM',
		response_format: {
			type: 'json_schema',
			json_schema: {
				type: 'object',
				properties: {
					prompts: {
						type: 'array',
						items: {
							type: 'string',
							description: "A short prompt that a user might ask an LLM"
						},
					},
				},
				required: ['prompts'],
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
	console.log({ id });
	// Use this pattern to poll for your async response status
	const response = await env.AI.run('@cf/meta/llama-3.3-70b-instruct-batch', {
		request_id: id,
	});
	return c.json(response);
});

export default app;
