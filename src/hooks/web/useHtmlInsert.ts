// Import necessary dependencies
import { h } from 'vue' // Add this import
import { ElMessageBox, ElLink } from 'element-plus'

// Type for tag types
type TagType = 'b' | 'i' | 'u' | 'precode'

/**
 * Hook for inserting HTML formatting tags into a text content.
 * @param getContent Async function to get current content
 * @param setContent Async function to set new content
 * @returns Object with insertion functions and renderFormattingButtons
 */
export function useHtmlInsert(
  getContent: () => Promise<string>,
  setContent: (newContent: string) => Promise<void>
) {
  // Function to insert text (append for simplicity)
  const insertText = async (textToInsert: string) => {
    const currentContent = await getContent()
    await setContent(currentContent + textToInsert)
  }

  // Insert basic tags with example text
  const insertTag = async (tagType: TagType) => {
    let exampleHtml = ''

    switch (tagType) {
      case 'b':
        exampleHtml = '<b>粗体文字示例</b>'
        break
      case 'i':
        exampleHtml = '<i>斜体文字示例</i>'
        break
      case 'u':
        exampleHtml = '<u>下划线文字示例</u>'
        break
      case 'precode':
        exampleHtml = '<pre><code>代码示例\n第二行代码示例</code></pre>'
        break
    }
    await insertText(exampleHtml)
  }

  // Insert hyperlink
  const insertLink = async () => {
    try {
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

      const { value: text } = await ElMessageBox.prompt(
        '请输入链接文字 (可选, 默认为链接地址)',
        '插入超链接',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          inputPlaceholder: '链接描述'
        }
      )

      const linkText = text || href
      const linkHtml = `<a href="${href.trim()}">${linkText.trim()}</a>`
      await insertText(linkHtml)
    } catch (action) {
      // Handle cancel or error silently
    }
  }

  // Insert TG user link
  const insertTgUserLink = async () => {
    try {
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

      const { value: text } = await ElMessageBox.prompt(
        '请输入链接显示的文字 (可选, 默认为用户名)',
        '插入TG用户链接',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          inputPlaceholder: username
        }
      )

      const linkText = text || username
      const userLinkHtml = `<a href="https://t.me/${username.trim()}">${linkText.trim()}</a>`
      await insertText(userLinkHtml)
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
