# HTML to PDF
To convert your HTML document into PDF or EPUB

## API
You can use the API to create your pdf file. Just send an `json` object to `https://html-to-pdf.saidi27.com/convert` and get your download link.

#### example
```
POST https://html-to-pdf.saidi27.com/convert
{
    title: "Your book title",
    detail: "some info about your book",
    author: "your name",
    theme: "your theme filename (public/stylesheets/prints/theme-[theme_name].css)",
    html: "your html content"
}
```

and if there wasn't any errors, the result will be:

```
{
    status: "ok",
    data: "download_url..."
}
```

## Contribution
You can fork the project, make your changes and send a PR and I'll take care of it. Please dont forget to add your name (if you want) to `index.html#contributors`.

To add your name, you can easily add the following line, into `index.twig#contributors`:

```
{% include 'contributer.twig' with {
    'image_address': 'your profile image address', 
    'name': 'your name', 
    'profession': 'what you do', 
    'twitter_address': 'your complete twitter account address', 
    'github_address': 'your github address', 
    'site_address': 'your website address', 
    'theme': 'warning | success | danger | info | primary'
} %}
```