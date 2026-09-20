# Support

opsinjs is a small, unfunded project. There is no company behind it, no support
contract, and no service-level agreement. Assume a few people doing this
alongside other work. Questions are usually answered. Sometimes they are not, and
a polite follow-up after a week is reasonable rather than rude. Two kinds of
message jump the queue, and both are called out below so that you know to say
them out loud.

## Where to take what

| You have | Take it to |
| --- | --- |
| A question about how to do something | A discussion on the repository (GitHub Discussions) |
| A page that is wrong, unclear or out of date | The report-a-problem control at the foot of that docs page, which opens a prefilled issue |
| A bug in a component or in this site | An issue, with a reproduction |
| A concern that a component or a piece of guidance could cause harm | A public issue, marked as a **safety concern** |
| A security vulnerability | [SECURITY.md](./SECURITY.md). Report it privately, and never open a public issue. |

The canonical repository is <https://github.com/prashantonomy/opsinjs>. When it is
public, the docs site is served at <https://opsinjs.pensievelabs.org>. That
subdomain is being attached to a fresh deployment and does not resolve yet.

## Not reachable yet

The repository is not public at the time of writing. Until it is, GitHub
Discussions, both kinds of issue, and the report-a-problem control at the foot of
every docs page have nowhere to land, because each of those routes ends at that
same repository. This is a known gap, not a mistake in this file. Opening the
repository is what turns the table above from an intention into a working route.

## Asking a question that gets answered

For a health design system the difference between an answerable question and an
unanswerable one is usually the context, so please include:

1. **What you are trying to show a person.** "A blood-pressure reading against
   their usual range" is answerable. "A card component" is not.
2. **What you tried**, including which docs page you were reading. If the docs
   sent you the wrong way, that is a docs bug and worth reporting on its own.
3. **The versions.** Which registry URL you installed a component from, and when
   you copied it, because nothing in the emitted source records where it came
   from.
4. **What "correct" would look like.** For anything clinical the right answer
   depends on what the number means for the person reading it, and we cannot
   guess that.

## Safety concerns come first

If following the guidance here could lead someone to misread their own health
data, that is the most important message this project can receive. Open a public
issue, say it is a safety concern in the first line, and do not bury it in a
feature request. A clinical safety concern is not a security vulnerability, and
routing it through the private security channel only slows it down.

## Contributing and community

The wider picture, including what response you can honestly expect and how to
contribute, is on the Community page in the docs. When the site is live it will
be at <https://opsinjs.pensievelabs.org/docs/project/community>. The source is at
[apps/www/content/docs/project/community.mdx](./apps/www/content/docs/project/community.mdx).
