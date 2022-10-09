import { useRouter } from 'next/router'
import axios from 'axios'
import { useQueryClient, useMutation } from '@tanstack/react-query'
import { Task } from '@prisma/client'
import useStore from '../store'
import { EditedTask } from '../types'

export const useMutateTask = () => {
  const queryClient = useQueryClient()
  const router = useRouter()
  const reset = useStore((state) => state.resetEditedTask)

  const createTaskMutation = useMutation(
    // idはバックエンドで自動的に連番がふられるので、省いておく
    async (task: Omit<EditedTask, 'id'>) => {
      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/todo`,
        task
      )
      return res.data
    },
    {
      // 成功した場合は、既存のキャッシュに加える
      onSuccess: (res) => {
        const previousTodos = queryClient.getQueryData<Task[]>(['tasks'])
        if (previousTodos) {
          // キャッシュを更新する
          queryClient.setQueryData(['tasks'], [res, ...previousTodos])
        }
        // ザスタントのedited taskのステートをリセットする
        reset()
      },
      onError: (err: any) => {
        reset()
        if (err.response.status === 401 || err.response.status === 403) {
          router.push('/')
        }
      },
    }
  )
  const updateTaskMutation = useMutation(
    async (task: EditedTask) => {
      const res = await axios.patch(
        `${process.env.NEXT_PUBLIC_API_URL}/todo/${task.id}`,
        task
      )
      return res.data
  }, {
    onSuccess: (res, variables) => {
      const previousTodos = queryClient.getQueryData<Task[]>(['tasks'])
      if (previousTodos) {
        queryClient.setQueryData(
          ['tasks'],
          // 既存のキャッシュにupdateしたtaskと同じidのものがあれば上書きする
          previousTodos.map((task) => (task.id === res.id ? res : task))
        )
      }
      // ザスタントのedited taskのステートをリセットする
      reset()
    },
    onError: (err: any) => {
      reset()
      if (err.response.status === 401 || err.response.status === 403) {
        router.push('/')
      }
    },
  })
  const deleteTaskMutation = useMutation(async (id: number) => {
    await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/todo/${id}`)
  },
  {
    // variablesには削除したidが入っている
    onSuccess: (_, variables) => {
      const previousTodos = queryClient.getQueryData<Task[]>(['tasks'])
      if (previousTodos) {
        queryClient.setQueryData(
          ['tasks'],
          // 今削除したtaskだけを取り除く
          previousTodos.filter((task) => task.id !== variables)
        )
      }
      reset()
    },
    onError: (err: any) => {
      reset()
      if (err.response.status === 401 || err.response.status === 403) {
        router.push('/')
      }
    },
  })

  return {
    createTaskMutation, updateTaskMutation, deleteTaskMutation
  }
}

