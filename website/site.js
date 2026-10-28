document.documentElement.classList.add('js')

const languageButtons = document.querySelectorAll('[data-language]')
const menuButton = document.querySelector('[data-menu-button]')
const navigation = document.querySelector('#site-navigation')
const demoTasks = [...document.querySelectorAll('[data-demo-task]')]

/**
 * Applies the visitor's language across the shared navigation and page content.
 * Called on page load and by language buttons to keep every page consistent.
 * Storage failure is harmless: the current page still switches language.
 *
 * @param {string} language - Supported site language, either ja or en.
 * @example
 * setLanguage('en');
 */
function setLanguage(language) {
  const selected = language === 'en' ? 'en' : 'ja'
  document.documentElement.lang = selected
  document.title =
    document.body.dataset[`title${selected === 'ja' ? 'Ja' : 'En'}`]

  // Keep the selected language visible to assistive technology.
  languageButtons.forEach((button) => {
    button.setAttribute(
      'aria-pressed',
      String(button.dataset.language === selected),
    )
  })
  document.querySelectorAll('[data-label-ja]').forEach((element) => {
    element.setAttribute(
      'aria-label',
      element.dataset[selected === 'ja' ? 'labelJa' : 'labelEn'],
    )
  })

  // Private browsing and disabled storage must not prevent language switching.
  try {
    localStorage.setItem('engage-site-language', selected)
  } catch {
    // The language remains active until the visitor navigates away.
  }
}

/**
 * Expands or closes the compact navigation when its button or a link is used.
 * Also called by the Escape handler so keyboard users can dismiss the menu.
 *
 * @param {boolean} open - Whether navigation links should be expanded.
 * @example
 * setMenuOpen(false);
 */
function setMenuOpen(open) {
  menuButton.setAttribute('aria-expanded', String(open))
  navigation.classList.toggle('is-open', open)
}

/**
 * Reflects sample task completion in the demo's count and progress bar.
 * Called after each sample task press; demo data is intentionally not saved.
 *
 * @example
 * updateDemoProgress();
 */
function updateDemoProgress() {
  const completed = demoTasks.filter(
    (task) => task.getAttribute('aria-pressed') === 'true',
  ).length
  const progress = document.querySelector('[data-demo-progress]')
  document.querySelector('[data-demo-count]').textContent = `${completed} / 3`
  progress.setAttribute('aria-valuenow', String(completed))
  progress.style.setProperty('--progress', `${(completed / 3) * 100}%`)
}

let initialLanguage = 'ja'
// Retain the chosen language between the home, support, and privacy pages.
try {
  initialLanguage = localStorage.getItem('engage-site-language') || 'ja'
} catch {
  // Japanese is the default when browser storage is unavailable.
}
setLanguage(initialLanguage)

languageButtons.forEach((button) => {
  button.addEventListener('click', () => setLanguage(button.dataset.language))
})
menuButton.addEventListener('click', () => {
  setMenuOpen(menuButton.getAttribute('aria-expanded') !== 'true')
})
navigation.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', () => setMenuOpen(false))
})
document.addEventListener('keydown', (event) => {
  // Return focus to the trigger after a keyboard dismissal.
  if (
    event.key === 'Escape' &&
    menuButton.getAttribute('aria-expanded') === 'true'
  ) {
    setMenuOpen(false)
    menuButton.focus()
  }
})
demoTasks.forEach((task) => {
  task.addEventListener('click', () => {
    task.setAttribute(
      'aria-pressed',
      String(task.getAttribute('aria-pressed') !== 'true'),
    )
    updateDemoProgress()
  })
})
