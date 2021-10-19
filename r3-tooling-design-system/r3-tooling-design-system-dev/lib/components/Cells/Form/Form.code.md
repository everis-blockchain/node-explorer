<Anchor idToScrollTo="properties"><h3>Properties</h3></Anchor>

| Property    | Type                  | Required? | Notes                                                                                                                                                                                                                                                                          |
| :---------- | :-------------------- | :-------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| onSubmit    | function (any) => any | yes       |                                                                                                                                                                                                                                                                                |
| className   | string                | no        | Classnames can be passed to the outermost wrapping `<form>` element of the component.                                                                                                                                                                                          |
| dark        | boolean               | no        | When the form is on a light background and needs to stand out more, the "dark" property can be set to true. This will make the form take on a light gray background colour. The "dark" property will need to be set to true on all the input elements within the form as well. |
| title       | string                | no        | Provides a title for the entire form (as opposed to the titles for particular sections of the form provided by the form group).                                                                                                                                                |
| Other Props | any                   | no        | Any other props that a `<form>` element can take. These will be applied to the outermost wrapping `<form>` element of the component.                                                                                                                                           |