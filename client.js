window.__ModuleLoader__.load({
  id: 'dsh-think-twice',
  factory(require) {
    const React = require('react')
    const h = React.createElement
    const name = 'dsh-think-twice/client'
    const inject = ['slots', 'remote']

    const json = Object.freeze({
      parse(value) {
        return value
      },
    })

    const descriptor = (method) => ({
      id: `dsh-think-twice/remote#dshThinkTwice/${method}`,
      service: 'dshThinkTwice',
      namespace: 'dshThinkTwice',
      method,
      invocation: { kind: 'direct' },
      parameters: [{
        name: 'request',
        wire: 'request',
        source: 'json',
        codec: {
          mode: 'strict',
          typeSymbol: 'dsh-think-twice#JsonRequest',
          schema: json,
          create: () => json,
        },
      }],
      result: {
        mode: 'strict',
        typeSymbol: 'dsh-think-twice#JsonResult',
        schema: json,
        create: () => json,
      },
    })

    const remoteContribution = Object.freeze({
      package: 'dsh-think-twice',
      descriptors: Object.freeze([
        descriptor('review'),
        descriptor('feedback'),
      ]),
    })

    const LAYER_LABELS = {
      language: '语言',
      logic: '逻辑',
      information: '信息',
    }
    const SEVERITY_LABELS = {
      high: '会卡住行动',
      medium: '可能被追问',
      low: '可读性',
    }

    const CSS = `
      .dsh-think-trigger {
        height: 28px;
        min-width: 56px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 5px;
        padding: 0 9px;
        border: 1px solid color-mix(in srgb, #a66b2f 24%, var(--dsw-alias-border-l2));
        border-radius: 9px;
        background: color-mix(in srgb, #a66b2f 8%, transparent);
        color: var(--dsw-alias-label-secondary);
        font: inherit;
        font-size: 12px;
        line-height: 1;
        cursor: pointer;
        transition: background .16s ease, color .16s ease, border-color .16s ease, transform .16s ease;
      }
      .dsh-think-trigger:hover:not(:disabled) {
        color: var(--dsw-alias-label-primary);
        border-color: color-mix(in srgb, #a66b2f 48%, var(--dsw-alias-border-l2));
        background: color-mix(in srgb, #a66b2f 14%, transparent);
      }
      .dsh-think-trigger:active:not(:disabled) { transform: scale(.96); }
      .dsh-think-trigger:disabled { cursor: default; opacity: .45; }
      .dsh-think-icon { width: 14px; height: 14px; flex: none; }
      .dsh-think-panel {
        box-sizing: border-box;
        width: 100%;
        margin: 8px 0 10px;
        padding: 13px 14px 12px;
        border: 1px solid color-mix(in srgb, #a66b2f 20%, var(--dsw-alias-border-l2));
        border-radius: 16px;
        color: var(--dsw-alias-label-primary);
        background:
          radial-gradient(circle at 10% 0%, color-mix(in srgb, #c68a4b 11%, transparent), transparent 34%),
          var(--dsw-alias-bg-layer-1);
        box-shadow: var(--dsw-shadow-lv2);
      }
      .dsh-think-head {
        display: flex;
        align-items: center;
        gap: 9px;
        min-height: 22px;
      }
      .dsh-think-kicker {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        color: var(--dsw-alias-label-primary);
        font-size: 12px;
        font-weight: 650;
      }
      .dsh-think-dot {
        width: 7px;
        height: 7px;
        border-radius: 50%;
        background: #a66b2f;
        box-shadow: 0 0 0 4px color-mix(in srgb, #a66b2f 11%, transparent);
      }
      .dsh-think-dot[data-success="true"] {
        background: var(--dsw-alias-state-success-primary);
        box-shadow: 0 0 0 4px color-mix(in srgb, var(--dsw-alias-state-success-primary) 11%, transparent);
      }
      .dsh-think-head-note {
        min-width: 0;
        overflow: hidden;
        color: var(--dsw-alias-label-tertiary);
        font-size: 11px;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .dsh-think-spacer { flex: 1; }
      .dsh-think-close {
        width: 25px;
        height: 25px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 0;
        border: 0;
        border-radius: 7px;
        color: var(--dsw-alias-label-tertiary);
        background: transparent;
        font: inherit;
        font-size: 17px;
        cursor: pointer;
      }
      .dsh-think-close:hover { color: var(--dsw-alias-label-primary); background: var(--dsw-alias-interactive-bg-hover); }
      .dsh-think-loading {
        display: flex;
        align-items: center;
        gap: 9px;
        margin-top: 11px;
        padding: 12px;
        border: 1px solid var(--dsw-alias-border-l2);
        border-radius: 12px;
        color: var(--dsw-alias-label-secondary);
        background: color-mix(in srgb, var(--dsw-alias-bg-module-platform) 82%, transparent);
        font-size: 12px;
      }
      .dsh-think-spinner {
        width: 14px;
        height: 14px;
        border: 1.5px solid var(--dsw-alias-border-l2);
        border-top-color: #a66b2f;
        border-radius: 50%;
        animation: dsh-think-spin .8s linear infinite;
      }
      .dsh-think-summary {
        margin-top: 10px;
        padding: 10px 11px;
        border: 1px solid var(--dsw-alias-border-l2);
        border-radius: 11px;
        color: var(--dsw-alias-label-secondary);
        background: color-mix(in srgb, var(--dsw-alias-bg-module-platform) 78%, transparent);
        font-size: 12px;
        line-height: 18px;
      }
      .dsh-think-summary[data-clear="true"] {
        border-color: color-mix(in srgb, var(--dsw-alias-state-success-primary) 24%, var(--dsw-alias-border-l2));
        background: color-mix(in srgb, var(--dsw-alias-state-success-primary) 7%, transparent);
      }
      .dsh-think-list {
        display: flex;
        flex-direction: column;
        gap: 9px;
        margin-top: 10px;
        max-height: min(48vh, 520px);
        overflow: auto;
        scrollbar-width: thin;
      }
      .dsh-think-question {
        padding: 11px 12px 10px;
        border: 1px solid var(--dsw-alias-border-l2);
        border-radius: 12px;
        background: color-mix(in srgb, var(--dsw-alias-bg-module-platform) 83%, transparent);
      }
      .dsh-think-question-top {
        display: flex;
        align-items: center;
        gap: 6px;
        margin-bottom: 7px;
      }
      .dsh-think-badge {
        display: inline-flex;
        align-items: center;
        padding: 2px 7px;
        border-radius: 999px;
        color: #8a5623;
        background: color-mix(in srgb, #a66b2f 11%, transparent);
        font-size: 10px;
        line-height: 16px;
      }
      .dsh-think-badge[data-layer="logic"] { color: #8b4c72; background: color-mix(in srgb, #9b5a82 11%, transparent); }
      .dsh-think-badge[data-layer="information"] { color: #2f6f68; background: color-mix(in srgb, #347f76 11%, transparent); }
      .dsh-think-severity {
        color: var(--dsw-alias-label-tertiary);
        font-size: 10px;
      }
      .dsh-think-quote {
        margin: 0 0 8px;
        padding-left: 9px;
        border-left: 2px solid color-mix(in srgb, #a66b2f 40%, var(--dsw-alias-border-l2));
        color: var(--dsw-alias-label-tertiary);
        font-size: 11.5px;
        line-height: 18px;
        overflow-wrap: anywhere;
      }
      .dsh-think-question-text {
        color: var(--dsw-alias-label-primary);
        font-size: 13px;
        font-weight: 560;
        line-height: 20px;
      }
      .dsh-think-why {
        margin-top: 5px;
        color: var(--dsw-alias-label-tertiary);
        font-size: 11px;
        line-height: 17px;
      }
      .dsh-think-question-actions {
        display: flex;
        align-items: center;
        gap: 6px;
        margin-top: 9px;
      }
      .dsh-think-feedback {
        height: 25px;
        padding: 0 8px;
        border: 1px solid var(--dsw-alias-border-l2);
        border-radius: 7px;
        color: var(--dsw-alias-label-tertiary);
        background: transparent;
        font: inherit;
        font-size: 10px;
        cursor: pointer;
      }
      .dsh-think-feedback:hover:not(:disabled) { color: var(--dsw-alias-label-primary); background: var(--dsw-alias-interactive-bg-hover); }
      .dsh-think-feedback[data-active="true"] { color: #8a5623; border-color: color-mix(in srgb, #a66b2f 35%, var(--dsw-alias-border-l2)); }
      .dsh-think-feedback:disabled { cursor: default; opacity: .55; }
      .dsh-think-footer {
        display: flex;
        align-items: center;
        gap: 8px;
        flex-wrap: wrap;
        margin-top: 10px;
      }
      .dsh-think-note {
        min-width: 0;
        flex: 1 1 240px;
        color: var(--dsw-alias-label-tertiary);
        font-size: 11px;
        line-height: 17px;
      }
      .dsh-think-actions { display: flex; align-items: center; gap: 7px; flex-wrap: wrap; }
      .dsh-think-action {
        min-height: 28px;
        padding: 0 10px;
        border: 1px solid var(--dsw-alias-border-l2);
        border-radius: 8px;
        color: var(--dsw-alias-label-secondary);
        background: transparent;
        font: inherit;
        font-size: 11px;
        cursor: pointer;
      }
      .dsh-think-action:hover:not(:disabled) { color: var(--dsw-alias-label-primary); background: var(--dsw-alias-interactive-bg-hover); }
      .dsh-think-action.primary {
        color: var(--dsw-alias-label-on-business, #fff);
        border-color: transparent;
        background: #9b642d;
      }
      .dsh-think-action:disabled { cursor: default; opacity: .5; }
      .dsh-think-error {
        margin-top: 10px;
        padding: 10px 11px;
        border: 1px solid color-mix(in srgb, var(--dsw-alias-state-error-primary) 32%, var(--dsw-alias-border-l2));
        border-radius: 10px;
        color: var(--dsw-alias-state-error-primary);
        background: color-mix(in srgb, var(--dsw-alias-state-error-primary) 7%, transparent);
        font-size: 12px;
        line-height: 18px;
      }
      @keyframes dsh-think-spin { to { transform: rotate(360deg); } }
      @media (max-width: 700px) {
        .dsh-think-head-note { display: none; }
      }
    `

    const STATES = new Map()
    const LISTENERS = new Set()

    function initialState() {
      return {
        visible: false,
        status: 'idle',
        source: '',
        result: null,
        error: '',
        feedback: {},
        startedAt: 0,
      }
    }

    function stateFor(sessionId) {
      if (!STATES.has(sessionId)) STATES.set(sessionId, initialState())
      return STATES.get(sessionId)
    }

    function publish(sessionId, patch) {
      STATES.set(sessionId, { ...stateFor(sessionId), ...patch })
      for (const listener of [...LISTENERS]) listener()
    }

    function subscribe(listener) {
      LISTENERS.add(listener)
      return () => LISTENERS.delete(listener)
    }

    function useReviewState(sessionId) {
      return React.useSyncExternalStore(
        subscribe,
        () => stateFor(sessionId),
        () => stateFor(sessionId),
      )
    }

    function installStyle() {
      if (typeof document === 'undefined') return () => {}
      const id = 'dsh-think-twice/styles'
      const existing = document.querySelector(`style[data-plugin-css="${id}"]`)
      if (existing) return () => {}
      const node = document.createElement('style')
      node.dataset.plugin = 'dsh-think-twice'
      node.dataset.pluginCss = id
      node.textContent = CSS
      ;(document.head || document.body || document.documentElement).appendChild(node)
      return () => node.remove()
    }

    function errorText(error) {
      return String(error && error.message ? error.message : error)
    }

    let callReview = null
    let callFeedback = null

    async function invokeReview(payload) {
      if (typeof callReview !== 'function') throw new Error('三思服务还没准备好，请刷新页面后重试。')
      const answered = await callReview(payload)
      if (!answered || answered.ok !== true) {
        const failure = answered && answered.error
        throw new Error(failure
          ? String(failure.message || failure.code || failure)
          : 'DSH Remote 调用失败')
      }
      const value = answered.value
      if (!value || value.ok !== true) {
        throw new Error(value && value.error ? value.error : '三思服务没有返回结果')
      }
      return value
    }

    async function invokeFeedback(payload) {
      if (typeof callFeedback !== 'function') return
      const answered = await callFeedback(payload)
      const value = answered && answered.value ? answered.value : answered
      if (!value || value.ok !== true) throw new Error(value && value.error ? value.error : '反馈保存失败')
    }

    async function startReview(sessionId, text) {
      const source = String(text || '').trim()
      if (!source || stateFor(sessionId).status === 'reviewing') return
      publish(sessionId, {
        visible: true,
        status: 'reviewing',
        source,
        result: null,
        error: '',
        feedback: {},
        startedAt: Date.now(),
      })
      try {
        const result = await invokeReview({ text: source, sessionId })
        publish(sessionId, { status: 'ready', result })
      } catch (error) {
        publish(sessionId, { status: 'error', error: errorText(error) })
      }
    }

    async function sendFeedback(sessionId, questionId, action) {
      const state = stateFor(sessionId)
      if (!state.result || !state.result.reviewId) return
      publish(sessionId, {
        feedback: { ...state.feedback, [questionId]: action },
      })
      try {
        await invokeFeedback({
          reviewId: state.result.reviewId,
          questionId,
          action,
        })
      } catch (error) {
        publish(sessionId, {
          error: errorText(error),
        })
      }
    }

    function ThinkIcon() {
      return h('svg', {
        className: 'dsh-think-icon',
        viewBox: '0 0 16 16',
        fill: 'none',
        stroke: 'currentColor',
        strokeWidth: 1.35,
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
        'aria-hidden': true,
      },
      h('path', { d: 'M3.2 3.3h9.6v7.2H7.2L4.4 13v-2.5H3.2V3.3Z' }),
      h('path', { d: 'M5.4 6.1h5.2M5.4 8.2h3.4' }))
    }

    function ThinkButton({ sessionId, useInput }) {
      const draft = useInput((state) => state.draft)
      const draftRef = React.useRef(draft)
      draftRef.current = draft
      const state = useReviewState(sessionId)
      const busy = state.status === 'reviewing'

      return h('button', {
        type: 'button',
        className: 'dsh-think-trigger',
        disabled: busy || draft.trim().length === 0,
        title: !draft.trim()
          ? '先输入内容，再点击三思'
          : busy
            ? '正在检查表达'
            : '只提问，不代写',
        'aria-label': '三思：检查当前草稿',
        onMouseDown: (event) => event.preventDefault(),
        onClick: () => {
          void startReview(sessionId, draftRef.current)
        },
      },
      h(ThinkIcon),
      h('span', null, busy ? '检查中' : '三思'))
    }

    function QuestionCard({ question, feedback, onFeedback }) {
      return h('article', { className: 'dsh-think-question' },
        h('div', { className: 'dsh-think-question-top' },
          h('span', { className: 'dsh-think-badge', 'data-layer': question.layer }, LAYER_LABELS[question.layer] || question.layer),
          h('span', { className: 'dsh-think-severity' }, SEVERITY_LABELS[question.severity] || question.severity)),
        h('p', { className: 'dsh-think-quote' }, `“${question.quote}”`),
        h('div', { className: 'dsh-think-question-text' }, question.question),
        question.why ? h('div', { className: 'dsh-think-why' }, question.why) : null,
        h('div', { className: 'dsh-think-question-actions' },
          h('button', {
            type: 'button',
            className: 'dsh-think-feedback',
            'data-active': feedback === 'helpful' ? 'true' : 'false',
            onMouseDown: (event) => event.preventDefault(),
            onClick: () => onFeedback(question.id, 'helpful'),
          }, feedback === 'helpful' ? '已标记：问得对' : '问得对'),
          h('button', {
            type: 'button',
            className: 'dsh-think-feedback',
            'data-active': feedback === 'edited' ? 'true' : 'false',
            onMouseDown: (event) => event.preventDefault(),
            onClick: () => onFeedback(question.id, 'edited'),
          }, feedback === 'edited' ? '已标记：我改了' : '我改了'),
          h('button', {
            type: 'button',
            className: 'dsh-think-feedback',
            'data-active': feedback === 'inaccurate' ? 'true' : 'false',
            onMouseDown: (event) => event.preventDefault(),
            onClick: () => onFeedback(question.id, 'inaccurate'),
          }, feedback === 'inaccurate' ? '已标记：不准' : '不准')))
    }

    function ThinkDock({ sessionId, useInput }) {
      const draft = useInput((state) => state.draft)
      const draftRef = React.useRef(draft)
      draftRef.current = draft
      const state = useReviewState(sessionId)
      if (!state.visible || state.status === 'idle') return null

      const result = state.result
      const questions = result && Array.isArray(result.questions) ? result.questions : []
      const close = () => publish(sessionId, { visible: false })
      const rerun = () => {
        const text = String(draftRef.current || '').trim()
        if (text) void startReview(sessionId, text)
      }
      const headNote = state.status === 'reviewing'
        ? '检查语言、逻辑和信息是否足够让对方行动'
        : result && result.degraded
          ? '模型没连上；以下只是本地规则能确认的问题'
          : result && result.route
            ? `当前会话模型：${result.route} · 只提问，不修改输入框`
            : '只提问，不修改输入框'

      return h('section', {
        className: 'dsh-think-panel',
        'data-status': state.status,
        'aria-label': 'DSH 三思工作区',
      },
      h('header', { className: 'dsh-think-head' },
        h('div', { className: 'dsh-think-kicker' },
          h('span', {
            className: 'dsh-think-dot',
            'data-success': state.status === 'ready' && questions.length === 0 ? 'true' : 'false',
          }),
          h('span', null, state.status === 'reviewing' ? '正在三思' : state.status === 'error' ? '三思失败' : '三思完成')),
        h('span', { className: 'dsh-think-head-note' }, headNote),
        h('span', { className: 'dsh-think-spacer' }),
        h('button', {
          type: 'button',
          className: 'dsh-think-close',
          title: '收起三思面板',
          'aria-label': '收起三思面板',
          onMouseDown: (event) => event.preventDefault(),
          onClick: close,
        }, '×')),

      state.status === 'reviewing'
        ? h('div', { className: 'dsh-think-loading' },
          h('span', { className: 'dsh-think-spinner', 'aria-hidden': true }),
          '正在找最值得你补的那一两处，不会替你改写。')
        : null,

      state.status === 'ready' && result
        ? h(React.Fragment, null,
          h('div', {
            className: 'dsh-think-summary',
            'data-clear': questions.length === 0 ? 'true' : 'false',
          }, result.summary),
          questions.length > 0
            ? h('div', { className: 'dsh-think-list' },
              ...questions.map((question) => h(QuestionCard, {
                key: question.id,
                question,
                feedback: state.feedback[question.id] || '',
                onFeedback: (questionId, action) => {
                  void sendFeedback(sessionId, questionId, action)
                },
              })))
            : null)
        : null,

      state.status === 'error'
        ? h('div', { className: 'dsh-think-error', role: 'alert' }, state.error || '三思失败，请重试。')
        : null,

      state.error && state.status !== 'error'
        ? h('div', { className: 'dsh-think-error', role: 'alert' }, state.error)
        : null,

      h('footer', { className: 'dsh-think-footer' },
        h('span', { className: 'dsh-think-note' },
          '修改权留给你。可以在输入框里自己改，改完再点“重新检查”。'),
        h('span', { className: 'dsh-think-actions' },
          h('button', {
            type: 'button',
            className: 'dsh-think-action',
            disabled: state.status === 'reviewing' || String(draftRef.current || '').trim() === '',
            onMouseDown: (event) => event.preventDefault(),
            onClick: rerun,
          }, '重新检查'),
          h('button', {
            type: 'button',
            className: 'dsh-think-action primary',
            onMouseDown: (event) => event.preventDefault(),
            onClick: close,
          }, '继续编辑'))))
    }

    async function apply(ctx) {
      const disposeRemote = await ctx.remote.$mount(remoteContribution)
      ctx.effect(() => () => {
        void disposeRemote()
      })

      const remote = ctx.get('remote.dshThinkTwice')
      if (!remote) throw new Error('dsh-think-twice: host Remote namespace is unavailable')
      callReview = (payload) => remote.review(payload)
      callFeedback = (payload) => remote.feedback(payload)

      const styleDisposer = installStyle()
      ctx.effect(() => () => styleDisposer())

      ctx.slots.inject('conversation.input.right', () => ctx.slots.register({
        name: 'conversation.input.right',
        id: 'dsh-think-twice-button',
        order: 31,
        label: '三思',
      }, ThinkButton))

      ctx.slots.inject('conversation.input.dock', () => ctx.slots.register({
        name: 'conversation.input.dock',
        id: 'dsh-think-twice-dock',
        order: 21,
        label: '三思工作区',
      }, ThinkDock))
    }

    return { name, inject, apply }
  },
})

