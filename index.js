// ==UserScript==
// @name         Refined GitHub Last Read
// @namespace    https://greasyfork.org/en/scripts/519044-refined-github-last-read
// @version      0.0.1
// @description  Show the last read position of issues and pull requests in GitHub.
// @author       Anthony Fu (https://github.com/antfu)
// @license      MIT
// @homepageURL  https://github.com/antfu/refined-github-last-read
// @supportURL   https://github.com/antfu/refined-github-last-read
// @match        https://github.com/**
// @icon         https://www.google.com/s2/favicons?sz=64&domain=github.com
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_registerMenuCommand
// @grant        GM_unregisterMenuCommand
// ==/UserScript==

// @ts-check

/**
 * @typedef {import('./index.d').LastReadRecord} LastReadRecord
 */

(function () {
  'use strict'

  const NAME = 'Refined GitHub Last Read'
  const STORAGE_KEY = 'refined-github-last-read'
  const ANCHOR_CLASS = 'refined-github-last-read-anchor'

  const AUTO_SCROLL = useOption('last-read-auto-scroll', 'Auto scroll to last read poisition', true)

  execute()
  // listen to github page loaded event
  document.addEventListener('pjax:end', () => execute())
  document.addEventListener('turbo:render', () => execute())

  // ------

  function execute() {
    // Skip if already exists
    if (document.querySelector(`.${ANCHOR_CLASS}`))
      return

    // Skip if not on the correct page
    const url = getUrl()
    if (!url)
      return

    // TODO: test with very long discussions where it contains hidden anchor
    // TODO: test with discussions
    const latest = queryLastestTimelineAnchor()
    if (!latest)
      return latest

    const stored = getStoredAnchorsFor(url)
    const last = stored[0]

    // eslint-disable-next-line no-console
    console.log(`[${NAME}] Report`, {
      url,
      last,
      latest,
    })

    if (last) {
      insertAfterAnchor(last)
    }

    // TODO: maybe do something with session id
    if (latest !== last?.anchor) {
      stored.unshift({ anchor: latest, time: Date.now(), session: getSessionId() })
      setStoredAnchorsFor(url, stored)
    }
  }

  /**
   * @param {string} url
   * @returns {LastReadRecord[]} records
   */
  function getStoredAnchorsFor(url) {
    const key = `${STORAGE_KEY}:${url}`
    const stored = localStorage.getItem(key)
    if (!stored)
      return []
    return JSON.parse(stored)
  }

  /**
   * @param {string} url
   * @param {LastReadRecord[]} records
   * @returns {void}
   */
  function setStoredAnchorsFor(url, records) {
    const key = `${STORAGE_KEY}:${url}`
    localStorage.setItem(key, JSON.stringify(records))
  }

  function getUrl() {
    const path = window.location.pathname
    if (!path.match(/\/(pull|issues|discussions)\/(\d+)$/))
      return undefined
    return path
  }

  function queryLastestTimelineAnchor() {
    const legacyTimelines = Array.from(document.querySelectorAll('.js-timeline-item'))
    const legacyLast = legacyTimelines.at(-1)
    if (legacyLast)
      return legacyLast.getAttribute('data-gid')

    const newTimelines = Array.from(document.querySelectorAll('[data-timeline-event-id]'))
    const newLast = newTimelines.at(-1)
    if (newLast)
      return newLast.getAttribute('data-timeline-event-id')
  }

  /**
   * @param {LastReadRecord} record
   */
  function insertAfterAnchor(record) {
    // Remove previous anchor
    document.querySelectorAll(`.${ANCHOR_CLASS}`).forEach(el => el.remove())
    // Find the timeline item
    const timeline
      = document.querySelector(`.js-timeline-item[data-gid="${record.anchor}"]`)
      || document.querySelector(`[data-timeline-event-id="${record.anchor}"]`)

    if (!timeline) {
      console.warn(`[${NAME}] Failed to find timeline item with ID ${record.anchor}`)
      return
    }
    const anchor = document.createElement('div')
    anchor.className = ANCHOR_CLASS
    Object.assign(anchor.style, {
      padding: '8px',
      color: 'var(--display-orange-fgColor)',
      borderRadius: '6px',
      margin: '8px 0',
      display: 'grid',
      gap: '0.25rem',
      gridTemplateColumns: '1fr auto auto 1fr',
    })
    const left = document.createElement('div')
    const right = document.createElement('div')
    Object.assign(left.style, {
      height: '1px',
      width: '100%',
      backgroundColor: 'var(--display-orange-borderColor-emphasis)',
      margin: 'auto',
    })
    Object.assign(right.style, {
      height: '1px',
      width: '100%',
      backgroundColor: 'var(--display-orange-borderColor-emphasis)',
      margin: 'auto',
    })
    anchor.appendChild(left)
    anchor.appendChild(document.createTextNode('Last read until here'))
    anchor.appendChild(createRelativeTimeTag(record.time))
    anchor.appendChild(right)
    timeline.after(anchor)

    if (AUTO_SCROLL.value)
      anchor.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  /**
   * @param {number} time
   */
  function createRelativeTimeTag(time) {
    const tag = document.createElement('relative-time')
    tag.setAttribute('datetime', new Date(time).toISOString())
    return tag
  }

  /**
   * @returns {string} Session ID
   */
  function getSessionId() {
    const STORAGE_KEY_SESSION_ID = `${STORAGE_KEY}:session-id`
    if (!sessionStorage.getItem(STORAGE_KEY_SESSION_ID))
      sessionStorage.setItem(STORAGE_KEY_SESSION_ID, new Date().toISOString())
    return sessionStorage.getItem(STORAGE_KEY_SESSION_ID)
  }

  /**
   * Create UI for the options
   * @template T
   * @param {string} key
   * @param {string} title
   * @param {T} defaultValue
   * @returns {{ value: T }} return
   */
  function useOption(key, title, defaultValue) {
    if (typeof GM_getValue === 'undefined') {
      return {
        value: defaultValue,
      }
    }

    let value = GM_getValue(key, defaultValue)
    const ref = {
      get value() {
        return value
      },
      set value(v) {
        value = v
        GM_setValue(key, v)
        location.reload()
      },
    }

    GM_registerMenuCommand(`${title}: ${value ? '✅' : '❌'}`, () => {
      ref.value = !value
    })

    return ref
  }
})()
