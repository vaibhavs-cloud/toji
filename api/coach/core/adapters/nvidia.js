/* NVIDIA NIM (Inference Microservice) integration.
 * Speaks OpenAI-compatible Chat Completions at https://integrate.api.nvidia.com/v1.
 * Models:
 *   - meta/llama-3.1-70b-instruct (Recommended default)
 *   - meta/llama-3.1-8b-instruct (Fast lightweight)
 *   - mistralai/mixtral-8x22b-instruct-v0.1
 */
import { httpAdapter } from './http.js';
import { chatCompletionsSpec } from './openai.js';

export const NVIDIA_MODELS = Object.freeze([
  'meta/llama-3.1-70b-instruct',
  'meta/llama-3.1-8b-instruct',
  'mistralai/mixtral-8x22b-instruct-v0.1'
]);

export const nvidiaSpec = {
  ...chatCompletionsSpec('nvidia', {
    maxTokensField: 'max_tokens',
    temperature: 0.2
  }),
  readModels: data => {
    const ids = (data?.data || data?.models || []).map(m => (typeof m === 'string' ? m : m.id || m.name)).filter(Boolean);
    const combined = [...NVIDIA_MODELS];
    for (const id of ids) {
      if (!combined.includes(id)) combined.push(id);
    }
    return combined.length ? combined : [...NVIDIA_MODELS];
  }
};

export default httpAdapter(nvidiaSpec);
