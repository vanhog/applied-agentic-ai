import { Agent } from '@mastra/core/agent';

const agent = new Agent({
  id: 'agent',
  name: 'Agent',
  instructions: 'Answer briefly.',
  //model: 'anthropic/claude-haiku-5-5',
  model: 'openai/gpt-4o-mini',
});

const result = await agent.generate(
  'Where to find the log files on a Linux Mint system?',
);
console.log(result.text);
