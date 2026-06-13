import { ref } from 'vue'
import { chatWithAssistant } from '@/api/ai'
import type { ChatResponse } from '@/types'

export function useAiChat() {
  const loading = ref(false)
  const question = ref('')
  const result = ref<ChatResponse | null>(null)

  async function submit() {
    if (!question.value.trim()) return
    loading.value = true
    try {
      const { data } = await chatWithAssistant({ question: question.value })
      result.value = data
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'AI 分析失败'
      throw new Error(message)
    } finally {
      loading.value = false
    }
  }

  function reset() {
    question.value = ''
    result.value = null
  }

  return { loading, question, result, submit, reset }
}
