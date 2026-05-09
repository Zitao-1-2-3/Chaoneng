// Import necessary dependencies
import { h, Ref } from 'vue'
import { ElMessageBox, ElLink } from 'element-plus'

// Type for tag types
type TagType = 'b' | 'i' | 'u' | 'precode'

/**
 * Hook for inserting HTML formatting tags into a text content.
 * @param getContent Async function to get current content
 * @param setContent Async function to set new content
 * @param textareaRef Optional ref to textarea element for selection support
 * @returns Object with insertion functions and renderFormattingButtons
 */
export function useHtmlInsert(
  getContent: () => Promise<string>,
  setContent: (newContent: string) => Promise<void>,
  textareaRef?: Ref<any>
) {
  // Get selected text from textarea
  const getSelectedText = (): { text: string; start: number; end: number } | null => {
    if (!textareaRef?.value) return null

    // 尝试获取 textarea 元素
    let textarea: HTMLTextAreaElement | null = null

    // 如果是 Element Plus 的 ElInput 组件
    if (textareaRef.value.$el) {
      textarea = textareaRef.value.$el.querySelector('textarea')
    } else if (textareaRef.value instanceof HTMLTextAreaElement) {
      textarea = textareaRef.value
    }

    if (!textarea) return null

    const start = textarea.selectionStart || 0
    const end = textarea.selectionEnd || 0
    const text = textarea.value.substring(start, end)

    return { text, start, end }
  }

  // Insert text at cursor position or replace selection
  const insertOrReplaceText = async (textToInsert: string, replaceSelection = false) => {
    const currentContent = await getContent()
    const selection = getSelectedText()

    if (replaceSelection && selection && selection.text) {
      // Replace selected text
      const before = currentContent.substring(0, selection.start)
      const after = currentContent.substring(selection.end)
      await setContent(before + textToInsert + after)
    } else {
      // Append to end
      await setContent(currentContent + textToInsert)
    }
  }

  // Insert basic tags with example text or wrap selected text
  const insertTag = async (tagType: TagType) => {
    const selection = getSelectedText()
    let htmlToInsert = ''

    // 如果有选中文本，包裹选中的文本
    if (selection && selection.text) {
      switch (tagType) {
        case 'b':
          htmlToInsert = `<b>${selection.text}</b>`
          break
        case 'i':
          htmlToInsert = `<i>${selection.text}</i>`
          break
        case 'u':
          htmlToInsert = `<u>${selection.text}</u>`
          break
        case 'precode':
          htmlToInsert = `<pre><code>${selection.text}</code></pre>`
          break
      }
      await insertOrReplaceText(htmlToInsert, true)
    } else {
      // 没有选中文本，插入示例
      switch (tagType) {
        case 'b':
          htmlToInsert = '<b>粗体文字</b>'
          break
        case 'i':
          htmlToInsert = '<i>斜体文字</i>'
          break
        case 'u':
          htmlToInsert = '<u>下划线文字</u>'
          break
        case 'precode':
          htmlToInsert = '<pre><code>代码示例</code></pre>'
          break
      }
      await insertOrReplaceText(htmlToInsert, false)
    }
  }

  // Insert hyperlink
  const insertLink = async () => {
    try {
      const selection = getSelectedText()
      const selectedText = selection?.text || ''

      const { value: href } = await ElMessageBox.prompt(
        '请输入链接地址 (例: https://example.com)',
        '插入超链接',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          inputPlaceholder: 'https://example.com',
          inputType: 'url'
        }
      )
      if (!href) return

      // 如果有选中文本，使用选中的文本作为默认链接文字
      const { value: text } = await ElMessageBox.prompt(
        '请输入链接文字 (可选, 默认为链接地址)',
        '插入超链接',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          inputPlaceholder: selectedText || '链接描述',
          inputValue: selectedText || ''
        }
      )

      const linkText = text || selectedText || href
      const linkHtml = `<a href="${href.trim()}">${linkText.trim()}</a>`
      await insertOrReplaceText(linkHtml, !!selectedText)
    } catch (action) {
      // Handle cancel or error silently
    }
  }

  // Insert TG user link
  const insertTgUserLink = async () => {
    try {
      const selection = getSelectedText()
      const selectedText = selection?.text || ''

      const { value: username } = await ElMessageBox.prompt(
        '请输入TG用户名 (例: tgwljsyy77)',
        '插入TG用户链接',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          inputPlaceholder: 'TG用户名'
        }
      )
      if (!username) return

      // 如果有选中文本，使用选中的文本作为默认链接文字
      const { value: text } = await ElMessageBox.prompt(
        '请输入链接显示的文字 (可选, 默认为用户名)',
        '插入TG用户链接',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          inputPlaceholder: selectedText || username,
          inputValue: selectedText || ''
        }
      )

      const linkText = text || selectedText || username
      const userLinkHtml = `<a href="https://t.me/${username.trim()}">${linkText.trim()}</a>`
      await insertOrReplaceText(userLinkHtml, !!selectedText)
    } catch (action) {
      // Handle cancel or error silently
    }
  }

  // Render function for formatting buttons (using Vue h to avoid JSX errors)
  const renderFormattingButtons = () =>
    h(
      'div',
      {
        style: {
          marginTop: '5px',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: '10px'
        }
      },
      [
        h(
          ElLink,
          {
            type: 'primary',
            underline: false,
            onClick: () => insertTag('b'),
            style: { fontSize: '13px', fontWeight: 'bold' }
          },
          'B'
        ),
        h(
          ElLink,
          {
            type: 'primary',
            underline: false,
            onClick: () => insertTag('i'),
            style: { fontSize: '13px', fontStyle: 'italic' }
          },
          'I'
        ),
        h(
          ElLink,
          {
            type: 'primary',
            underline: false,
            onClick: () => insertTag('u'),
            style: { fontSize: '13px', textDecoration: 'underline' }
          },
          'U'
        ),
        h(
          ElLink,
          { type: 'primary', underline: false, onClick: insertLink, style: { fontSize: '13px' } },
          '链接'
        ),
        h(
          ElLink,
          {
            type: 'primary',
            underline: false,
            onClick: insertTgUserLink,
            style: { fontSize: '13px' }
          },
          'TG用户'
        ),
        h(
          ElLink,
          {
            type: 'primary',
            underline: false,
            onClick: () => insertTag('precode'),
            style: { fontSize: '13px' }
          },
          '代码块'
        )
      ]
    )

  return {
    insertTag,
    insertLink,
    insertTgUserLink,
    renderFormattingButtons
  }
}
