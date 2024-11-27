# Userscript: Refined GitHub Last Read

Show the last read position of issues and pull requests in GitHub.

[Install on Greasyfork](https://greasyfork.org/en/scripts/519044-refined-github-last-read)

## Usage

### Configurations

You can

### Clear Storage

Run the following code under `github.com` in the console to clear the storage:

```js
function clear() {
  for (const key in localStorage) {
    if (key.startsWith(`refined-github-last-read:`))
      localStorage.removeItem(key)
  }
}
```

## Sponsors

<p align="center">
  <a href="https://cdn.jsdelivr.net/gh/antfu/static/sponsors.svg">
    <img src='https://cdn.jsdelivr.net/gh/antfu/static/sponsors.svg'/>
  </a>
</p>

## License

[MIT](./LICENSE) License © 2023 [Anthony Fu](https://github.com/antfu)
