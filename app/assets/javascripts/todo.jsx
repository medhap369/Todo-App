requirejs(["main"], function () {
    requirejs(['reactjs', 'jquery'], function (React, $) {

        function myupload(item, url, type) {
            $.ajax({
                url: url,
                cache: false,
                type: "POST",
                contentType: "application/json",
                data: JSON.stringify({data:item, type:type}),
                success: function (data) {
                    console.log("OK");
                },
                error: function (data) {
                    console.log(data);
                }
            });
        };

        var Input = React.createClass({

            handleSubmit: function (e) {
                var newname = React.findDOMNode(this.refs.text).value;
                this.props.aaa(newname);
                React.findDOMNode(this.refs.text).value = '';
                return false;
            },
            render: function () {
                return (
                    <form onSubmit={this.handleSubmit} >
                        <input type="text" ref="text"/>
                    </form>
                )
            }

        });

        var Item = React.createClass({

            getInitialState: function () {
                name = ""
                if (this.props.value.status == 1)
                    name="Red"
                return {name: name, disable: ""}
            },

            handleUpdate: function () {
                this.props.update(this.props.value);

                if (this.props.value.status == 1) {
                    this.state.name = "Red";
                    this.state.disable = "disabled";

                    this.setState();
                }

            },
            handleDelete: function () {
                this.props.delete(this.props.value);
            },
            render: function () {
                value = this.props.value;
                return (
                    <li>
                        <span className={this.state.name}>{this.props.value.name}</span>
                        <input type="button" value="Finish" onClick={this.handleUpdate} disabled={this.state.disable}/>
                        <input type="button" value="Delete" onClick={this.handleDelete}/>
                    </li>
                )
            }

        });

        var List = React.createClass({
            getInitialState: function () {
                return {list: []}
            },
            loadTasks: function () {
                $.get(this.props.source, function (result) {
                    this.setState({list: result});
                }.bind(this));
            },
            add: function (item) {

                var id = 0;
                if(this.state.list.length > 0)
                     id = this.state.list[this.state.list.length - 1].id + 1;

                var obj = {id: id, name: item, status: 0}

                myupload(obj, this.props.source_update, 'add');


                this.state.list.push(obj);
                this.setState();
            },

            update: function (item) {

                item.status = 1;
                myupload(item, this.props.source_update, 'update');

                var i = this.state.list.indexOf(item);
                this.state.list[i].status = 1;
            },

            remove: function (item) {

                myupload(item, this.props.source_update, 'remove');

                var i = this.state.list.indexOf(item);

                if (i != -1) {
                    this.state.list.splice(i, 1);
                }

                this.setState();
            },
            componentWillMount: function () {
                this.loadTasks();
            },
            render: function () {
                var remove1 = this.remove;
                var update1 = this.update;

                //console.log(this.state.list);
                return (
                    <div>
                        <Input aaa={this.add}/>
                        <ul>
                            {
                                this.state.list.map(function (item) {
                                    return (
                                        <Item key={item.id} value={item} delete={remove1} update={update1}/>
                                    )
                                })
                            }
                        </ul>
                    </div>
                )
            }
        });

        React.render(
            <List source="/todo-list" source_update="/todo-change"/>,
            document.getElementById("container")
        )
    });
});