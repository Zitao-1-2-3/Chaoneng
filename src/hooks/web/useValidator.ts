import { useI18n } from '@/hooks/web/useI18n'
import { FormItemRule } from 'element-plus'

interface LengthRange {
  min: number
  max: number
  message?: string
}

export const useValidator = () => {
  const { t } = useI18n()

  const required = (message?: string): FormItemRule => {
    return {
      required: true,
      validator: (_, value, callback) => {
        if (!value && value !== 0) {
          callback(new Error(message || t('common.required')))
        } else {
          callback()
        }
      }
    }
  }

  const lengthRange = (options: LengthRange): FormItemRule => {
    const { min, max, message } = options

    return {
      min,
      max,
      validator: (_, value, callback) => {
        if (value && (value.length < min || value.length > max)) {
          callback(new Error(message || t('common.lengthRange', { min, max })))
        } else {
          callback()
        }
      }
    }
  }

  const notSpace = (message?: string): FormItemRule => {
    return {
      validator: (_, val, callback) => {
        if (val?.indexOf(' ') !== -1) {
          callback(new Error(message || t('common.notSpace')))
        } else {
          callback()
        }
      }
    }
  }

  const notSpecialCharacters = (message?: string): FormItemRule => {
    return {
      validator: (_, val, callback) => {
        if (/[`~!@#$%^&*()_+<>?:"{},.\/;'[\]]/gi.test(val)) {
          callback(new Error(message || t('common.notSpecialCharacters')))
        } else {
          callback()
        }
      }
    }
  }

  const noChinese = (message?: string): FormItemRule => {
    return {
      validator: (_, val, callback) => {
        if (!val) return callback()
        if (/[\u4e00-\u9fa5]/.test(val)) {
          callback(new Error(message || '不能包含中文字符'))
        } else {
          callback()
        }
      }
    }
  }

  const phone = (message?: string): FormItemRule => {
    return {
      validator: (_, val, callback) => {
        if (!val) return callback()
        if (!/^1[3456789]\d{9}$/.test(val)) {
          callback(new Error(message || '请输入正确的手机号码'))
        } else {
          callback()
        }
      }
    }
  }

  const email = (message?: string): FormItemRule => {
    return {
      validator: (_, val, callback) => {
        if (!val) return callback()
        if (!/^(\w-*\.*)+@(\w-?)+(\.\w{2,})+$/.test(val)) {
          callback(new Error(message || '请输入正确的邮箱'))
        } else {
          callback()
        }
      }
    }
  }

  const maxlength = (max: number): FormItemRule => {
    return {
      validator: (_, value, callback) => {
        if (value && value.length > max) {
          callback(new Error('长度不能超过' + max + '个字符'))
        } else {
          callback()
        }
      }
    }
  }

  const check = (message?: string): FormItemRule => {
    return {
      validator: (_, val, callback) => {
        if (!val) {
          callback(new Error(message || t('common.required')))
        } else {
          callback()
        }
      }
    }
  }

  return {
    required,
    lengthRange,
    notSpace,
    notSpecialCharacters,
    noChinese,
    phone,
    email,
    maxlength,
    check
  }
}
