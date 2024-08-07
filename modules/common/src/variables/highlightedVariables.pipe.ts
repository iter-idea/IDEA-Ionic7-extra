import { Injectable, PipeTransform, Pipe } from '@angular/core';

/**
 * Higlighted variables.
 */
@Pipe({ name: 'highlight' })
@Injectable()
export class IDEAHiglightedVariables implements PipeTransform {
  transform(value: string, variables: string[]): any {
    if (variables && variables.length)
      variables.forEach(v => (value = value.replace(new RegExp(v, 'g'), str => str.small())));
    return value;
  }
}
