import { expect } from 'chai';

import { complete } from './complete';
import { code } from './code-utils';

describe("Complete Tests", function() {

    it("complete unknown value", function() {
        const content = code('my_var := 10\nmy_second_var := "10"\nmy_other_var := my@{1}stic');
        const result = complete(content.value, content.positions[1]);
        expect(result).to.eql([ { value: "my_second_var" }, { value: "my_var" } ]);
    });

    it("complete value in integer context", function() {
        const content = code('my_var := 10\nmy_second_var := "10"\nmy_other_var := 1 - my@{1}stic');
        const result = complete(content.value, content.positions[1]);
        expect(result).to.eql([ { value: "my_var" } ]);
    });

    it("complete value in bad operation", function() {
        const content = code('my_var := 10\nmy_second_var := "10"\nmy_other_var := my@{1}stic - ');
        const result = complete(content.value, content.positions[1]);
        expect(result).to.eql([ { value: "my_var" } ]);
    });

});