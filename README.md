# HTML to PDF
To convert your HTML document into PDF or EPUB

## How to use the API
You can use the API to create your pdf file. Just send an `json` object to `http://localhost:4001/convert` and get your download link.

#### example
```
POST http://localhost:4001/convert
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

## Install procedure

To install the project, go into the root directory of the project and run `npm install` or `yarn install`. Then run `npm run dev` to start the node server.

Please note that you are going to need to change AWS S3 parameters and `AWS_AKID` or AWS Access key ID and `AWS_SAK` or AWS Security access key of your AWS IAM user.

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

## License
MIT.