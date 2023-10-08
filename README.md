# **Upwork Bot**

![Upwork](https://assets-global.website-files.com/5ec7dad2e6f6295a9e2a23dd/62279a8cea48468ffd59888d_upwork-logo.svg)

Upwork bot is an automate job generating latest job data from upwork.com
upwork bot read registered RSS URL based on user input and send the notifier via discord channel at the scheduled time to help user up to date with job update
it written in the Javascript Language.

## **Usage**
There are several command that you can use to setting up the upwork bot

### **JOB**
job command used to get recent job based on user input
it will return latest jobs when the script executed, there are several rules that you can use on this command to generate latest job

**Filters:**
**experience level: **
- entry level
- intermediate
- expert

**type:**
- hourly
- fixed

**proposals:**
- 5
- 10
- 15
- 20
- 50

**previous client**

**hires:**
- no hires
- 9
- 10

The filters are optional, you can add filters or no based on what you need
you can put more than one filter to your filters to get more specific job types
to apply filters, here the example

`!job [job search query] !filters:[parameter]=[value]`

```
!job node.js !filter:experience level=entry level&type=fixed&proposal=5&payment verified&hires=no hires
```

on the result data, you can see the RSS URL that you can use on RSS command
you can also get the RSS URL from upwork.com job search page



### **RSS**
RSS command is used to set up the RSS settings to make the discord notifier work


```
!rss
```
this command used to show the list of registered RSS URL on upwork bot, from this list will be used as data source for upwork bot to get data


```
!rss start
```
to add notifier to discord channel, use this command on your designed channel to make them as job notification channel
the bot will send notification on channel where you type the script


```
!rss stop
```
to stop the notification you can use this command, the bot will reset the registered channel and stop the notification
and to restart the notifier you can type `!rss start`


```
!rss add [id] [link]
```
to add new RSS URL, use `!rss add [id] [link]` to add new RSS data source for upwork bot to get
please note that you need to declare id as unique id name without space to make it work, as example
```
!rss add dataScraping https://www.upwork.com/ab/feed/jobs/rss?q=data+scraping&sort=recency&proposals=0-4&verified_payment_only=1&paging=0%3B10&api_params=1&securityToken= .....
```


```
!rss remove [id]
```
to remove RSS URL, use `!rss remove [id]`
the RSS id is the id that you register when adding the RSS URL and to see the id, you can use command `!rss`

