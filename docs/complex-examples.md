# Complex Jora query examples

## Example 1

This query calculates the average age of people grouped by their occupation, sorts the results by the average age in descending order, and returns an array of objects containing the occupation and the average age.

Assuming the data is structured like this:

```js
{
    people: [
        { name: 'Alice', age: 34, occupation: 'Engineer' },
        { name: 'Bob', age: 42, occupation: 'Doctor' },
        { name: 'Charlie', age: 28, occupation: 'Engineer' },
        { name: 'David', age: 50, occupation: 'Doctor' },
        { name: 'Eve', age: 23, occupation: 'Student' }
    ]
}
```

The Jora query would be:

```jora
people
  .group(=> occupation)
  .({
    occupation: key,
    averageAge: value.reduce(=> $$ + age, 0) / value.size()
  })
  .sort(averageAge desc)
```

This query will return the following output:

```js
[
    { occupation: 'Doctor', averageAge: 46 },
    { occupation: 'Engineer', averageAge: 31 },
    { occupation: 'Student', averageAge: 23 }
]
```

## Example 2

Jora query that demonstrates calculating the percentage of people in each occupation who have a specific skill.

Let's assume the data structure is as follows:

```js
const data = {
    people: [
        { name: 'Alice', age: 30, occupation: 'Doctor', skills: ['A', 'B', 'C'] },
        { name: 'Bob', age: 35, occupation: 'Doctor', skills: ['A', 'D'] },
        { name: 'Charlie', age: 28, occupation: 'Engineer', skills: ['A', 'B'] },
        { name: 'David', age: 26, occupation: 'Engineer', skills: ['C', 'D'] },
        { name: 'Eva', age: 23, occupation: 'Student', skills: ['A', 'B', 'C'] },
        { name: 'Frank', age: 22, occupation: 'Student', skills: ['D', 'E'] }
    ]
};
```

The Jora query would be:

```jora
people
  .group(=> occupation)
  .({
    $valueWithSkill: value.[skills has #.skill].size();
    $totalCount: value.size();

    occupation: key,
    skill: #.skill,
    totalCount: $totalCount,
    skillCount: $valueWithSkill,
    skillPercentage: $valueWithSkill / $totalCount * 100
  })
  .sort(skillPercentage desc)
```

Given the data and context, this query will produce the following output:

```js
// jora('...query...')(data, { skill: 'A' })
[
    { occupation: 'Doctor', skill: 'A', totalCount: 2, skillCount: 2, skillPercentage: 100 },
    { occupation: 'Engineer', skill: 'A', totalCount: 2, skillCount: 1, skillPercentage: 50 },
    { occupation: 'Student', skill: 'A', totalCount: 2, skillCount: 1, skillPercentage: 50 }
]
```

## Example 3: Book listing with filtered and ranked tags

The Jora query takes an input data object containing books, authors, tags, and reviews, and returns a list of books that match the specified tag filter. For each book, the query maps the title, author's name, list of tags, and the top review (based on rating and date). The top review text is truncated to 150 characters.

```jora
$authors;
$tags;
$reviews;

books
  .({
    $bookId: id;
    $authorId;
    $author: $authors[=> id = $authorId];
    $tagIds;

    title,
    author: $author.name,
    tags: $tags.[id in $tagIds].name,
    topReview: $reviews
      .[bookId = $bookId]
      .sort(rating desc, date desc)[0]
      | {
        rating,
        text: `${text[0:150]}...`
      }
  })
  .[tags has #.tagFilter]
  .sort(topReview.rating desc, title asc)
```

<details>
<summary>Input</summary>

TypeScript definitions:

```ts
type InputData = {
    books: Book[];
    authors: Author[];
    tags: Tag[];
    reviews: Review[];
};

type Author = {
    id: number;
    name: string;
};

type Tag = {
    id: number;
    name: string;
};

type Book = {
    id: number;
    title: string;
    authorId: number;
    tagIds: number[];
};

type Review = {
    bookId: number;
    rating: number;
    text: string;
    date: Date;
};
```

Data example:

```json
{
    "books": [
        {
            "id": 1,
            "title": "The Great Book",
            "authorId": 101,
            "tagIds": [201, 202]
        },
        {
            "id": 2,
            "title": "A Fantastic Read",
            "authorId": 102,
            "tagIds": [202, 203]
        }
    ],
    "authors": [
        {
            "id": 101,
            "name": "John Doe"
        },
        {
            "id": 102,
            "name": "Jane Smith"
        }
    ],
    "tags": [
        {
            "id": 201,
            "name": "Fiction"
        },
        {
            "id": 202,
            "name": "Thriller"
        },
        {
            "id": 203,
            "name": "Mystery"
        }
    ],
    "reviews": [
        {
            "bookId": 1,
            "rating": 5,
            "text": "An amazing book! I loved every moment of it.",
            "date": "2023-01-01T00:00:00.000Z"
        },
        {
            "bookId": 2,
            "rating": 4,
            "text": "A captivating story with great characters.",
            "date": "2023-01-15T00:00:00.000Z"
        }
    ]
}
```

</details>

<details>
<summary>Output</summary>

TypeScript definitions:

```ts
type QueryResult = ResultBook[];

type ResultBook = {
    title: string;
    author: string;
    tags: string[];
    topReview: {
        rating: number;
        text: string;
    };
};
```

Data example:

> jora('...query...')(inputData, { tagFilter: 'Thriller' })

```json
[
    {
        "title": "The Great Book",
        "author": "John Doe",
        "tags": ["Fiction", "Thriller"],
        "topReview": {
        "rating": 5,
            "text": "An amazing book! I loved every moment of it...."
        }
    },
    {
        "title": "A Fantastic Read",
        "author": "Jane Smith",
        "tags": ["Thriller", "Mystery"],
        "topReview": {
        "rating": 4,
            "text": "A captivating story with great characters...."
        }
    }
]
```

</details>

<details>
<summary>Equivalent implementations</summary>

#### JavaScript

```js
function getMappedBooks(inputData, tagFilter) {
    const { books, authors, tags, reviews } = inputData;
    
    const filteredBooks = books
        .map(book => {
            const author = authors.find(author => author.id === book.authorId);
            const bookTags = tags.filter(tag => book.tagIds.includes(tag.id));
            
            const bookReviews = reviews.filter(review => review.bookId === book.id);
            const sortedReviews = bookReviews.sort((a, b) => {
                const ratingDiff = b.rating - a.rating;
                if (ratingDiff !== 0) {
                    return ratingDiff;
                }
                return new Date(b.date) - new Date(a.date);
            });
            const topReview = sortedReviews[0] && {
                rating: sortedReviews[0].rating,
                text: `${sortedReviews[0].text.slice(0, 150)}...`
            };
            
            return {
                title: book.title,
                author: author.name,
                tags: bookTags.map(tag => tag.name),
                topReview: topReview
            };
        })
        .filter(mappedBook => tagFilter.some(tag => mappedBook.tags.includes(tag)))
        .sort((a, b) => {
            const ratingDiff = b.topReview.rating - a.topReview.rating;
            if (ratingDiff !== 0) {
                return ratingDiff;
            }
            return a.title.localeCompare(b.title);
        });
    
    return filteredBooks;
}
```

#### jq

```jq
.books
| map({
    title: .title,
    author: (.authorId as $aid | .authors[] | select(.id == $aid).name),
    tags: (.tagIds | map(. as $tid | .tags[] | select(.id == $tid).name)),
    topReview: (
        .id as $bid
        | .reviews
        | map(select(.bookId == $bid))
        | sort_by(-.rating, .date)
        | .[0]
        | {
            rating: .rating,
            text: (.text | .[0:150] + "...")
        }
    )
})
| map(select(.tags | any(. as $t | .[] == $t)))
| sort_by(.topReview.rating, .title)
```

</details>

How the query works:

- Defines three variables (`$authors`, `$tags`, and `$reviews`) that reference the respective input data arrays.
- Iterates through the books array, creating a new object for each book with the following properties:
    - `title`: The book's title.
    - `author`: The author's name, found by looking up the author from the `$authors` array.
    - `tags`: An array of tag names, found by looking up the tags from the `$tags` array.
    - `topReview`: The highest-rated review (or the most recent one in case of a tie), with its text truncated to 150 characters.
- Filters the resulting book list to include only those with a tag that matches the provided tagFilter.
- Sorts the books by the top review rating in descending order, and then by title in ascending order.


## Example 4: Monthly event summary

This query generates a summary of events, grouped by month, including the total number of events and the count of unique users who participated in those events.

```jora
events
  .({
    $userId;
    $user: @.users[=> id = $userId];

    eventType,
    eventDate: timestamp,
    eventMonth: timestamp[0:7],
    userName: $user.name,
    userEmail: $user.email
  })
  .group(=> eventMonth)
  .({
    month: key,
    totalEvents: value.size(),
    uniqueUsers: value.userName.size()
  })
  .sort(month asc)
```

<details>
<summary>Input</summary>

TypeScript definitions:

```typescript
type QueryInput = Event[];

type Event = {
    eventName: string;
    eventDetails: string;
    userId: number;
    timestamp: string;
};

type User = {
    id: number;
    name: string;
    email: string;
};
```

Data example:

```json
{
  "events": [
    {
      "eventName": "Workshop",
      "eventDetails": "Introduction to Programming",
      "userId": 1,
      "timestamp": "2023-01-15T14:00:00Z"
    },
    {
      "eventName": "Conference",
      "eventDetails": "Tech Summit",
      "userId": 2,
      "timestamp": "2023-01-20T09:00:00Z"
    },
    {
      "eventName": "Webinar",
      "eventDetails": "Web Development Basics",
      "userId": 1,
      "timestamp": "2023-02-05T18:00:00Z"
    },
    {
      "eventName": "Workshop",
      "eventDetails": "Advanced Programming Techniques",
      "userId": 3,
      "timestamp": "2023-02-25T14:00:00Z"
    }
  ],
  "users": [
    {
      "id": 1,
      "name": "Alice",
      "email": "alice@example.com"
    },
    {
      "id": 2,
      "name": "Bob",
      "email": "bob@example.com"
    },
    {
      "id": 3,
      "name": "Carol",
      "email": "carol@example.com"
    }
  ]
}
```
</details>

<details>
<summary>Output</summary>

Data example:

```json
[
  {
    "month": "2023-01",
    "totalEvents": 2,
    "uniqueUsers": 2
  },
  {
    "month": "2023-02",
    "totalEvents": 2,
    "uniqueUsers": 2
  }
]
```
</details>

<details>
<summary>Equivalent implementations</summary>

#### JavaScript

```js
function processEvents(events, users) {
    const eventsWithUserDetails = events.map(event => {
        const userId = event.userId;
        const user = users.find(user => user.id === userId);

        return {
            eventType: event.eventName,
            eventDate: event.timestamp,
            eventMonth: event.timestamp.slice(0, 7),
            userName: user.name,
            userEmail: user.email
        };
    });

    const groupedEvents = eventsWithUserDetails.reduce((acc, event) => {
        const month = event.eventMonth;
        if (!acc[month]) {
            acc[month] = [];
        }
        acc[month].push(event);
        return acc;
    }, {});

    const result = Object.entries(groupedEvents).map(([month, events]) => {
        const uniqueUsers = new Set(events.map(event => event.userName)).size;

        return {
            month,
            totalEvents: events.length,
            uniqueUsers
        };
    });

    result.sort((a, b) => a.month.localeCompare(b.month));
    return result;
}
```

#### jq

```jq
[
  .events[] as $event
  | {
      userId: $event.userId,
      user: (.users[] | select(.id == $event.userId)),
      eventType: $event.eventName,
      eventDate: $event.timestamp,
      eventMonth: ($event.timestamp[0:7])
    }
]
| group_by(.eventMonth)
| map({
    month: .[0].eventMonth,
    totalEvents: length,
    uniqueUsers: (reduce .[].user.id as $id ({}; .[$id] |= . + 1) | length)
  })
| sort_by(.month)
```
</details>

The query takes an input dataset containing information about events and users. The events dataset has information about each event's `eventName`, `eventDetails`, `userId`, and `timestamp`. The users dataset has information about each user's `id`, `name`, and `email`.

The structure of the query is as follows:

1. Iterate over the `events` dataset and create a new object for each event with the following properties:
    - `eventType`: Copy the event's `eventName`
    - `eventDate`: Copy the event's `timestamp`
    - `eventMonth`: Extract the month part (year and month) from the event's `timestamp`
    - `userName`: Find the user associated with the event by `userId` and get their name
    - `userEmail`: Find the user associated with the event by `userId` and get their email
2. Group the transformed events by `eventMonth`.
3. For each group, create a new object with the following properties:
    - `month`: The key for the group, which is the month (year and month)
    - `totalEvents`: The total number of events in the group
    - `uniqueUsers`: The total number of unique users in the group, calculated by counting unique `userName` values
4. Sort the resulting objects by `month` in ascending order.

The output of the query is a list of objects representing a summary of events per month, including the total number of events and unique users who participated in those events.

## Example 5: Average rating per product category

A jora query that calculates the average rating for each product category and sorts the categories by the average rating.

```jora
products
  .group(=> category)
  .({
    $sum: => reduce(=> $$ + $, 0);
    $totalRatingsAndCount: reduce(=> {
        sum: $$.sum + value.ratings.$sum(),
        count: $$.count + value.ratings.size()
    }, { sum: 0, count: 0 });
    
    category: key,
    averageRating: $totalRatingsAndCount | sum / count,
    productCount: value.size()
  })
  .sort(averageRating desc)
```

<details>
<summary>Input</summary>

Data structure (TypeScript types):

```typescript
type InputData = {
    products: Product[];
};

type Product = {
    id: string;
    name: string;
    category: string;
    ratings: number[];
};
```

JSON:

```json
{
    "products": [
        {
            "id": "1",
            "name": "Product A",
            "category": "Electronics",
            "ratings": [4, 5, 4]
        },
        {
            "id": "2",
            "name": "Product B",
            "category": "Electronics",
            "ratings": [5, 5, 5]
        },
        {
            "id": "3",
            "name": "Product C",
            "category": "Books",
            "ratings": [3, 4, 3]
        },
        {
            "id": "4",
            "name": "Product D",
            "category": "Books",
            "ratings": [2, 2, 2]
        },
        {
            "id": "5",
            "name": "Product E",
            "category": "Clothing",
            "ratings": [4, 5, 5]
        }
    ]
}
```
</details>

<details>
<summary>Output</summary>

```json
[
    {
        "category": "Electronics",
        "averageRating": 4.666666666666667,
        "productCount": 2
    },
    {
        "category": "Clothing",
        "averageRating": 4.666666666666667,
        "productCount": 1
    },
    {
        "category": "Books",
        "averageRating": 3,
        "productCount": 2
    }
]
```
</details>

<details>
<summary>Equivalent implementations</summary>

#### JavaScript

```js
function calculateAverageRatings(inputData) {
    const products = inputData.products;
    const categoryGroups = {};

    products.forEach(product => {
        const category = product.category;

        if (!categoryGroups.hasOwnProperty(category)) {
            categoryGroups[category] = {
                ratingsSum: 0,
                ratingsCount: 0,
                productCount: 0
            };
        }

        const ratingsSum = product.ratings.reduce((a, b) => a + b, 0);
        const ratingsCount = product.ratings.length;

        categoryGroups[category].ratingsSum += ratingsSum;
        categoryGroups[category].ratingsCount += ratingsCount;
        categoryGroups[category].productCount++;
    });

    const results = Object.entries(categoryGroups).map(([category, data]) => ({
        category,
        averageRating: data.ratingsSum / data.ratingsCount,
        productCount: data.productCount
    }));

    results.sort((a, b) => b.averageRating - a.averageRating);

    return results;
}
```

#### jq

```jq
.products
| group_by(.category)
| map(
  {
    category: .[0].category,
    averageRating: (map(.ratings | add) | add) / (map(.ratings | length) | add),
    productCount: length
  }
)
| sort_by(-.averageRating)
```

</details>

This Jora query performs the following operations:

1. Groups the products by their category using the `group()` method.
2. Maps each group to an object containing:
   - The category name as `category`
   - The average rating for the category as `$averageRating`
   - The number of products in the category as `productCount`
3. To calculate the average rating, it first calculates the total sum and count of ratings for each product and then combines the sum and count for each category.
4. Divides the total sum of ratings by the total count to obtain the average rating.
5. Sorts the result by the average rating in descending order using the `sort()` method.

The resulting output will be an array of objects containing the category, average rating, and product count, sorted by the average rating.

## Exmaple 6

The following query groups products by the count of popular tags they match and sorts the groups in descending order.

```jora
$popularTags: products
  .group(=> tags)
  .sort(value.size() desc)
  .key[0:5];

products
  .({
    ...,
    popularTagsMatchCount: tags.[$ in $popularTags].size()
  })
  .sort(popularTagsMatchCount desc, category asc, price asc)
  .group(=> popularTagsMatchCount)
  .({
    popularTagsCount: key,
    products: value.({ name, category, price })
  })
```

<details>
<summary>Input</summary>

Data structure (TypeScript types):

```ts
type InputData = {
    products: Product[];
};

type Product = {
    id: number;
    name: string;
    category: string;
    price: number;
    tags: string[];
};
```

Data:

```json
{
  "products": [
    {
      "id": 1,
      "name": "Product A",
      "category": "Electronics",
      "price": 200,
      "tags": ["trending", "smart", "wireless"]
    },
    {
      "id": 2,
      "name": "Product B",
      "category": "Electronics",
      "price": 150,
      "tags": ["smart", "wireless"]
    },
    {
      "id": 3,
      "name": "Product C",
      "category": "Clothing",
      "price": 50,
      "tags": ["trending", "fashion"]
    },
    {
      "id": 4,
      "name": "Product D",
      "category": "Clothing",
      "price": 80,
      "tags": ["fashion", "casual"]
    },
    {
      "id": 5,
      "name": "Product E",
      "category": "Electronics",
      "price": 100,
      "tags": ["trending", "smart"]
    }
  ]
}
```
</details>

<details>
<summary>Output</summary>

```json
[
  {
    "popularTagsCount": 3,
    "products": [
      {
        "name": "Product A",
        "category": "Electronics",
        "price": 200
      }
    ]
  },
  {
    "popularTagsCount": 2,
    "products": [
      {
        "name": "Product B",
        "category": "Electronics",
        "price": 150
      },
      {
        "name": "Product E",
        "category": "Electronics",
        "price": 100
      },
      {
        "name": "Product C",
        "category": "Clothing",
        "price": 50
      }
    ]
  },
  {
    "popularTagsCount": 1,
    "products": [
      {
        "name": "Product D",
        "category": "Clothing",
        "price": 80
      }
    ]
  }
]
```
</details>

<details>
<summary>Equivalent implementations</summary>

#### JavaScript

```js
function getProductsSortedByPopularTags(data) {
    const popularTags = data.products
        .flatMap(product => product.tags)
        .reduce((acc, tag) => {
            acc[tag] = (acc[tag] || 0) + 1;
            return acc;
        }, {})
        .entries()
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(entry => entry[0]);

    const productsWithPopularTagsCount = data.products.map(product => {
        const popularTagsMatchCount = product.tags.filter(tag => popularTags.includes(tag)).length;
        return {
            ...product,
            popularTagsMatchCount
        };
    });

    const sortedProducts = productsWithPopularTagsCount.sort((a, b) => {
        if (b.popularTagsMatchCount !== a.popularTagsMatchCount) {
            return b.popularTagsMatchCount - a.popularTagsMatchCount;
        }

        if (a.category !== b.category) {
            return a.category.localeCompare(b.category);
        }

        return a.price - b.price;
    });

    const groupedProducts = sortedProducts.reduce((acc, product) => {
        if (!acc[product.popularTagsMatchCount]) {
            acc[product.popularTagsMatchCount] = [];
        }

        acc[product.popularTagsMatchCount].push({
            name: product.name,
            category: product.category,
            price: product.price
        });

        return acc;
    }, {});

    return Object.entries(groupedProducts).map(([popularTagsCount, products]) => ({
        popularTagsCount: Number(popularTagsCount),
        products
    }));
}
```

#### jq

```jq
def popular_tags:
  group_by(.tags[]) | map({tag: .[0].tags[], count: length}) | sort_by(-.count) | .[0:5] | map(.tag);

def product_info: { name, category, price };

def popular_tags_match_count(tags, popularTags): length(tags | map(select(. as $tag | popularTags | index($tag) != null)));

def sorted_products(popularTags):
  map({ product: ., popularTagsMatchCount: (popular_tags_match_count(.tags, popularTags)) }) | sort_by(-.popularTagsMatchCount, .product.category, .product.price);

{
  popularTags: (popular_tags),
  groupedProducts: (sorted_products(popular_tags))
    | group_by(.popularTagsMatchCount)
    | map({ popularTagsCount: .[0].popularTagsMatchCount, products: [.[] | .product | product_info] })
}
```

</details>

The Jora query is composed of two main parts:

1. Calculate the top 5 popular tags in products. This expression calculates the popular tags by using the `group()` function with the `tags` property as the key. When a function in `group()` returns an array, a value will be added to several groups corresponding to each element in the array. The groups are then sorted by size in descending order. The top 5 tags are selected using slice notation `[0:5]`:

```jora
$popularTags: products
  .group(=> tags)
  .sort(value.size() desc)
  .key[0:5];
```

2. Add a `popularTagsMatchCount` field to each product by counting the number of popular tags it has, and then group the products by this count:

```jora
products
  .({
    ...,
    popularTagsMatchCount: tags.[$ in $popularTags].size()
  })
```

3. Sort products within each group by the `popularTagsMatchCount` in descending order, then by `category` in ascending order, and finally by `price` in ascending order:

```jora
  .sort(popularTagsMatchCount desc, category asc, price asc)
```

4. Group the products by their `popularTagsMatchCount`, and for each group, create an object with the count and an array of products containing their `name`, `category`, and `price`:

```jora
  .group(=> popularTagsMatchCount)
  .({
    popularTagsCount: key,
    products: value.({ name, category, price })
  })
```
